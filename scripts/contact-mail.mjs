// Shared by the Node preview and the Cloudflare Worker. No browser credentials.
export const DEFAULT_CONTACT_TO = 'leir0491@gmail.com';
export const MAX_CONTACT_BYTES = 32 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/;
const CONTROL_RE = /[\u0000-\u001f\u007f]/;
const FIELDS = new Set(['name', 'email', 'topic', 'subject', 'message', 'url', 'website']);

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}
const fail = (error, status = 400) => json({ error }, status);
const validEmail = (value) => value.length <= 254 && value.split('@')[0].length <= 64 && !CONTROL_RE.test(value) && !/[,;:]/.test(value) && EMAIL_RE.test(value);
const isSingleLine = (value) => !CONTROL_RE.test(value);

function validFrom(value) {
  if (!value || !isSingleLine(value)) return false;
  const mailbox = value.match(/^[^<>]{1,80}\s*<([^<>]+)>$/)?.[1] ?? value;
  return validEmail(mailbox.trim());
}

function mailConfig(env) {
  const key = (env.RESEND_API_KEY ?? '').trim();
  const from = (env.CONTACT_FROM ?? '').trim();
  const to = (env.CONTACT_TO ?? DEFAULT_CONTACT_TO).trim();
  return key && !CONTROL_RE.test(key) && validFrom(from) && validEmail(to) ? { key, from, to } : null;
}

function sameOrigin(request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

async function readBody(request) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_CONTACT_BYTES) return { error: 'request_too_large', status: 413 };
  if (!request.body) return { error: 'invalid_json', status: 400 };
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_CONTACT_BYTES) {
        // Do not await cancellation: a remote sender may never finish its body.
        void reader.cancel().catch(() => {});
        return { error: 'request_too_large', status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch { return { error: 'invalid_json', status: 400 }; }
  finally { reader.releaseLock(); }
}

function validate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'invalid_fields' };
  if (Object.keys(value).some((key) => !FIELDS.has(key))) return { error: 'invalid_fields' };
  for (const field of FIELDS) {
    if (value[field] !== undefined && typeof value[field] !== 'string') return { error: 'invalid_fields' };
  }
  const data = {
    name: (value.name ?? '').trim(),
    email: (value.email ?? '').trim(),
    topic: value.topic ?? 'message',
    subject: (value.subject ?? '').trim(),
    message: (value.message ?? '').trim(),
    url: (value.url ?? '').trim(),
    website: (value.website ?? '').trim(),
  };
  if (data.website || data.website.length > 256) return { error: 'forbidden', status: 403 };
  if (!validEmail(data.email)) return { error: 'invalid_email' };
  if (data.name.length > 80 || !isSingleLine(data.name)) return { error: 'invalid_name' };
  if (data.subject.length > 120 || !isSingleLine(data.subject)) return { error: 'invalid_subject' };
  if (!['message', 'submission'].includes(data.topic)) return { error: 'invalid_topic' };
  if (data.message.length < 10 || data.message.length > 6000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data.message)) return { error: 'invalid_message' };
  if (data.url) {
    try {
      const url = new URL(data.url);
      if (data.url.length > 2048 || !isSingleLine(data.url) || !['https:', 'http:'].includes(url.protocol) || url.username || url.password) return { error: 'invalid_url' };
    } catch { return { error: 'invalid_url' }; }
  } else if (data.topic === 'submission') return { error: 'submission_url_required' };
  return { data };
}

/** Isolate-scoped limits supplement optional Cloudflare rate-limit bindings. */
export function createContactHandler({ fetchImpl = (...args) => fetch(...args), now = Date.now } = {}) {
  const clients = new Map();
  let globalBucket = { start: now(), count: 0 };
  function consume(clientKey) {
    const time = now();
    if (time - globalBucket.start >= WINDOW_MS) {
      globalBucket = { start: time, count: 0 };
      for (const [key, bucket] of clients) if (time - bucket.start >= WINDOW_MS) clients.delete(key);
    }
    if (globalBucket.count >= 50) return false;
    const key = String(clientKey || 'unknown').slice(0, 128);
    let bucket = clients.get(key);
    if (!bucket || time - bucket.start >= WINDOW_MS) {
      bucket = { start: time, count: 0 };
      clients.set(key, bucket);
    }
    if (bucket.count >= 5) return false;
    bucket.count++;
    globalBucket.count++;
    return true;
  }

  return async function contact(request, env = {}, { clientKey = 'unknown' } = {}) {
    if (!['GET', 'POST'].includes(request.method)) return fail('method_not_allowed', 405);
    if (!sameOrigin(request)) return fail('forbidden', 403);
    if (request.method === 'GET') return json({ available: Boolean(mailConfig(env)) });
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return fail('invalid_content_type', 415);

    const body = await readBody(request);
    if (body.error) return fail(body.error, body.status);
    const validated = validate(body.value);
    if (validated.error) return fail(validated.error, validated.status);
    const { data } = validated;
    const config = mailConfig(env);
    if (!config) return fail('service_unavailable', 503);
    const { key, from, to } = config;
    // Count delivery attempts only after validation and configuration are ready.
    if (!consume(clientKey)) return json({ error: 'rate_limited' }, 429, { 'retry-after': '600' });
    try {
      if (env.CONTACT_IP_LIMIT && !(await env.CONTACT_IP_LIMIT.limit({ key: String(clientKey) })).success) return fail('rate_limited', 429);
      if (env.CONTACT_GLOBAL_LIMIT && !(await env.CONTACT_GLOBAL_LIMIT.limit({ key: 'contact-global' })).success) return fail('rate_limited', 429);
    } catch { return fail('service_unavailable', 503); }

    const topic = data.topic === 'submission' ? '组件投稿' : '访客留言';
    const text = [
      `类型：${topic}`, `称呼：${data.name || '未填写'}`, `回复邮箱：${data.email}`,
      ...(data.subject ? [`主题：${data.subject}`] : []),
      ...(data.url ? [`组件或参考链接：${data.url}`] : []),
      '', '留言内容：', data.message,
    ].join('\n');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from, to: [to], reply_to: data.email,
          subject: `[LeiBox · ${topic}]${data.subject ? ` ${data.subject}` : ''}`,
          text,
        }),
        signal: controller.signal,
      });
      if (response.status === 429) return fail('rate_limited', 429);
      if (!response.ok) return fail('send_failed', 502);
      const result = await response.json().catch(() => null);
      if (!result || typeof result.id !== 'string' || !result.id) return fail('send_failed', 502);
      return json({ ok: true });
    } catch { return fail('send_failed', 502); }
    finally { clearTimeout(timeout); }
  };
}
