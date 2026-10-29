import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { request } from 'node:http';

function getResponse(url, { headers, method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = request(url, { headers, method }, res => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(text) }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

async function startServer(trustProxy, t) {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ['scripts/serve-local.mjs'], {
    env: { ...process.env, PORT: String(port), TRUST_PROXY: String(trustProxy), RESEND_API_KEY: '', CONTACT_FROM: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  await once(child.stdout, 'data');
  return `http://127.0.0.1:${port}/api/contact`;
}

test('trusted HTTPS proxy preserves the contact origin without sending mail', async t => {
  const url = await startServer(true, t);
  const headers = { host: 'leibox.pantoria.cn', origin: 'https://leibox.pantoria.cn', 'x-forwarded-proto': 'https' };
  const status = await getResponse(url, { headers });
  assert.equal(status.status, 200);
  assert.deepEqual(status.json, { available: false });
  const invalid = await getResponse(url, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: '{}' });
  assert.equal(invalid.status, 400);
  assert.deepEqual(invalid.json, { error: 'invalid_email' });
  const foreign = await getResponse(url, { headers: { ...headers, origin: 'https://foreign.example' } });
  assert.equal(foreign.status, 403);
});

test('forwarded HTTPS is ignored unless proxy trust is explicitly enabled', async t => {
  const url = await startServer(false, t);
  const response = await getResponse(url, { headers: { host: 'leibox.pantoria.cn', origin: 'https://leibox.pantoria.cn', 'x-forwarded-proto': 'https' } });
  assert.equal(response.status, 403);
});
