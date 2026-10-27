import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { createContactHandler, DEFAULT_CONTACT_TO, MAX_CONTACT_BYTES } from './contact-mail.mjs';

const CONFIG = { RESEND_API_KEY: 'test-only-local-key', CONTACT_FROM: 'UI collection <hello@example.test>' };
const FORM = { name: '访客', email: 'reader@example.test', topic: 'message', message: '这是一条用于验证留言发送的测试内容。', url: '', website: '' };
function request(value = FORM, headers = {}, options = {}) {
  return new Request('https://collection.example.test/api/contact', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://collection.example.test', ...headers },
    body: JSON.stringify(value), ...options,
  });
}
function mockHandler(response = () => Response.json({ id: 'local-test-id' })) {
  const calls = [];
  const handler = createContactHandler({ fetchImpl: async (...args) => { calls.push(args); return response(); } });
  return { handler, calls };
}
const errorOf = async (response, status, error) => {
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { error });
};

test('valid message uses a fixed recipient, text body and visitor reply-to', async () => {
  const { handler, calls } = mockHandler();
  const response = await handler(request({ ...FORM, message: '<script>alert("x")</script> stays plain text.' }), CONFIG, { clientKey: 'test-client' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls.length, 1);
  const [url, init] = calls[0];
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.authorization, `Bearer ${CONFIG.RESEND_API_KEY}`);
  const mail = JSON.parse(init.body);
  assert.deepEqual(mail.to, [DEFAULT_CONTACT_TO]);
  assert.equal(mail.from, CONFIG.CONTACT_FROM);
  assert.equal(mail.reply_to, FORM.email);
  assert.match(mail.subject, /访客留言/);
  assert.match(mail.text, /<script>/);
  assert.equal(mail.html, undefined);
  assert.equal(mail.cc, undefined);
});

test('component submission includes the reference link and optional subject', async () => {
  const { handler, calls } = mockHandler();
  const response = await handler(request({ ...FORM, topic: 'submission', url: 'https://example.test/component', subject: '光效按钮' }), CONFIG);
  assert.equal(response.status, 200);
  const mail = JSON.parse(calls[0][1].body);
  assert.match(mail.subject, /组件投稿.*光效按钮/);
  assert.match(mail.text, /https:\/\/example.test\/component/);
});

test('missing or invalid mail configuration returns 503 without any delivery attempt', async () => {
  for (const env of [{}, { RESEND_API_KEY: 'test-key' }, { ...CONFIG, CONTACT_FROM: 'bad sender' }, { ...CONFIG, CONTACT_TO: 'bad recipient' }]) {
    const { handler, calls } = mockHandler();
    await errorOf(await handler(request(), env), 503, 'service_unavailable');
    assert.equal(calls.length, 0);
  }
});

test('unconfigured retries never consume the delivery allowance or hide the setup failure', async () => {
  const { handler, calls } = mockHandler();
  for (let index = 0; index < 8; index++) {
    await errorOf(await handler(request(), {}, { clientKey: 'same-visitor' }), 503, 'service_unavailable');
  }
  assert.equal(calls.length, 0);
  assert.equal((await handler(request(), CONFIG, { clientKey: 'same-visitor' })).status, 200);
  assert.equal(calls.length, 1);
});

test('read-only availability reports configuration without sending or consuming delivery allowance', async () => {
  const { handler, calls } = mockHandler();
  for (const [env, available] of [[{}, false], [{ ...CONFIG, CONTACT_FROM: 'bad sender' }, false], [CONFIG, true]]) {
    for (let index = 0; index < 6; index++) {
      const result = await handler(new Request('https://collection.example.test/api/contact'), env, { clientKey: 'same-visitor' });
      assert.equal(result.status, 200);
      assert.deepEqual(await result.json(), { available });
      assert.equal(result.headers.get('cache-control'), 'no-store');
    }
  }
  assert.equal(calls.length, 0);
  assert.equal((await handler(request(), CONFIG, { clientKey: 'same-visitor' })).status, 200);
});

test('request cannot override recipient or inject email headers', async () => {
  const cases = [
    [{ ...FORM, to: 'attacker@example.test' }, 'invalid_fields'],
    [{ ...FORM, email: 'reader@example.test\r\nBcc: attacker@example.test' }, 'invalid_email'],
    [{ ...FORM, email: 'reader\u0000@example.test' }, 'invalid_email'],
    [{ ...FORM, email: 'reader,attacker@example.test' }, 'invalid_email'],
    [{ ...FORM, name: 'Name\r\nBcc: attacker@example.test' }, 'invalid_name'],
    [{ ...FORM, subject: 'Hello\r\nBcc: attacker@example.test' }, 'invalid_subject'],
  ];
  for (const [data, code] of cases) {
    const { handler, calls } = mockHandler();
    await errorOf(await handler(request(data), CONFIG), 400, code);
    assert.equal(calls.length, 0);
  }
});

test('body schema and lengths reject malformed inputs before contacting provider', async () => {
  const cases = [
    [null, 'invalid_fields'], [[], 'invalid_fields'], [{ ...FORM, email: 123 }, 'invalid_fields'],
    [{ ...FORM, email: 'invalid' }, 'invalid_email'], [{ ...FORM, email: `${'a'.repeat(65)}@example.test` }, 'invalid_email'],
    [{ ...FORM, name: 'a'.repeat(81) }, 'invalid_name'], [{ ...FORM, subject: 'a'.repeat(121) }, 'invalid_subject'],
    [{ ...FORM, message: 'short' }, 'invalid_message'], [{ ...FORM, message: 'a'.repeat(6001) }, 'invalid_message'],
    [{ ...FORM, topic: 'newsletter' }, 'invalid_topic'], [{ ...FORM, url: 'javascript:alert(1)' }, 'invalid_url'],
    [{ ...FORM, url: 'https://user:password@example.test/' }, 'invalid_url'], [{ ...FORM, topic: 'submission' }, 'submission_url_required'],
  ];
  for (const [data, code] of cases) {
    const { handler, calls } = mockHandler();
    await errorOf(await handler(request(data), CONFIG), 400, code);
    assert.equal(calls.length, 0);
  }
});

test('honeypot submission is refused without sending', async () => {
  const { handler, calls } = mockHandler();
  await errorOf(await handler(request({ ...FORM, website: 'bot-filled-field' }), CONFIG), 403, 'forbidden');
  assert.equal(calls.length, 0);
});

test('method, origin and content type are checked', async () => {
  const cases = [
    [new Request('https://collection.example.test/api/contact', { method: 'PUT' }), 405, 'method_not_allowed'],
    [request(FORM, { origin: 'https://other.example.test' }), 403, 'forbidden'],
    [request(FORM, { origin: 'null' }), 403, 'forbidden'],
    [request(FORM, { 'sec-fetch-site': 'cross-site' }), 403, 'forbidden'],
    [request(FORM, { 'content-type': 'text/plain' }), 415, 'invalid_content_type'],
  ];
  for (const [req, status, code] of cases) {
    const { handler, calls } = mockHandler();
    await errorOf(await handler(req, CONFIG), status, code);
    assert.equal(calls.length, 0);
  }
});

test('invalid JSON and oversized byte streams are bounded', async () => {
  const cases = [
    [request(FORM, {}, { body: '{broken' }), 400, 'invalid_json'],
    [request(FORM, { 'content-length': String(MAX_CONTACT_BYTES + 1) }), 413, 'request_too_large'],
    [request(FORM, {}, { body: '界'.repeat(MAX_CONTACT_BYTES / 2) }), 413, 'request_too_large'],
  ];
  for (const [req, status, code] of cases) {
    const { handler, calls } = mockHandler();
    await errorOf(await handler(req, CONFIG), status, code);
    assert.equal(calls.length, 0);
  }
});

test('client limit rejects a sixth attempt and resets after its time window', async () => {
  let clock = 1000;
  let sent = 0;
  const handler = createContactHandler({ now: () => clock, fetchImpl: async () => { sent++; return Response.json({ id: 'mock-id' }); } });
  for (let index = 0; index < 5; index++) assert.equal((await handler(request(), CONFIG, { clientKey: 'client-a' })).status, 200);
  const limited = await handler(request(), CONFIG, { clientKey: 'client-a' });
  assert.equal(limited.headers.get('retry-after'), '600');
  await errorOf(limited, 429, 'rate_limited');
  assert.equal(sent, 5);
  clock += 10 * 60 * 1000;
  assert.equal((await handler(request(), CONFIG, { clientKey: 'client-a' })).status, 200);
  assert.equal(sent, 6);
});

test('global limit also bounds requests from distinct clients', async () => {
  const { handler, calls } = mockHandler();
  for (let index = 0; index < 50; index++) assert.equal((await handler(request(), CONFIG, { clientKey: `client-${index}` })).status, 200);
  await errorOf(await handler(request(), CONFIG, { clientKey: 'new-client' }), 429, 'rate_limited');
  assert.equal(calls.length, 50);
});

test('provider failures are reported, and an HTTP 200 without a message id is not success', async () => {
  for (const response of [
    () => new Response('private provider details', { status: 403 }),
    () => new Response('private provider details', { status: 500 }),
    () => Response.json({ error: 'not actually sent' }),
    () => { throw new Error('private network details'); },
  ]) {
    const { handler } = mockHandler(response);
    const result = await handler(request(), CONFIG);
    await errorOf(result, 502, 'send_failed');
  }
  const { handler } = mockHandler(() => new Response('', { status: 429 }));
  await errorOf(await handler(request(), CONFIG), 429, 'rate_limited');
});

test('platform rate-limit bindings can refuse delivery and fail closed', async () => {
  for (const [binding, status, code] of [
    [{ limit: async () => ({ success: false }) }, 429, 'rate_limited'],
    [{ limit: async () => { throw new Error('binding unavailable'); } }, 503, 'service_unavailable'],
  ]) {
    const { handler, calls } = mockHandler();
    await errorOf(await handler(request(), { ...CONFIG, CONTACT_IP_LIMIT: binding }), status, code);
    assert.equal(calls.length, 0);
  }
});

test('Node preview exposes /api/contact and refuses unconfigured delivery over HTTP', async () => {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(process.execPath, ['scripts/serve-local.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), RESEND_API_KEY: '', CONTACT_FROM: '', CONTACT_TO: DEFAULT_CONTACT_TO },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Preview server did not start.')), 5000);
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Preview server exited: ${code}`)); });
      child.stdout.on('data', (data) => { if (data.toString().includes(`:${port}`)) { clearTimeout(timeout); resolve(); } });
    });
    const base = `http://127.0.0.1:${port}`;
    const result = await fetch(`${base}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify(FORM) });
    await errorOf(result, 503, 'service_unavailable');
    const crossOrigin = await fetch(`${base}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://outside.example.test' }, body: JSON.stringify(FORM) });
    await errorOf(crossOrigin, 403, 'forbidden');
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
      await once(child, 'exit');
    }
  }
});
