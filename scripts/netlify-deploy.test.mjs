import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await build({
  entryPoints: [path.join(root, "netlify/functions/api.ts")],
  bundle: true, write: false, platform: "node", format: "esm",
});
const { default: api } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const origin = "https://leibox-ui.netlify.app";
const request = (pathname, body = {}, headers = {}) => new Request(origin + pathname, {
  method: "POST", headers: { "content-type": "application/json", origin, ...headers },
  body: JSON.stringify(body),
});

test("Netlify preserves API validation, same-origin checks and unknown routes", async () => {
  const availability = await api(new Request(origin + "/api/contact"), { ip: "192.0.2.1" });
  assert.equal(availability.status, 200);
  assert.equal(typeof (await availability.json()).available, "boolean");
  assert.equal((await api(new Request(origin + "/api/contact", { method: "PUT" }), { ip: "192.0.2.1" })).status, 405);
  assert.equal((await api(request("/api/contact", {}, { origin: "https://external.example" }), { ip: "192.0.2.2" })).status, 403);
  assert.equal((await api(request("/api/contact", {}, { "content-type": "text/plain" }), { ip: "192.0.2.3" })).status, 415);
  const invalid = await api(request("/api/contact"), { ip: "192.0.2.4" });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: "invalid_email" });
  assert.equal((await api(request("/api/unknown"), { ip: "192.0.2.5" })).status, 404);
});

test("unconfigured production mail returns unavailable instead of simulated success", async () => {
  const previous = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    const response = await api(request("/api/contact", {
      email: "reader@example.test", message: "Deployment configuration test only.",
    }), { ip: "192.0.2.10" });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "service_unavailable" });
    assert.equal((await api(request("/api/subscribe"), { ip: "192.0.2.11" })).status, 503);
  } finally {
    if (previous !== undefined) process.env.RESEND_API_KEY = previous;
  }
});

test("Netlify platform IP cannot be overridden with a spoofed Cloudflare header", async (t) => {
  const config = { RESEND_API_KEY: "test-api-key", CONTACT_FROM: "sender@example.test", CONTACT_TO: "owner@example.test" };
  const previous = Object.fromEntries(Object.keys(config).map(key => [key, process.env[key]]));
  Object.assign(process.env, config);
  let deliveries = 0;
  t.mock.method(globalThis, "fetch", async url => {
    assert.equal(url, "https://api.resend.com/emails");
    deliveries++;
    return Response.json({ id: "test-email-id" });
  });
  try {
    for (let i = 0; i < 6; i++) {
      const response = await api(request("/api/contact", {
        email: "reader@example.test", message: "Rate limit verification only.",
      }, { "cf-connecting-ip": `198.51.100.${i}` }), { ip: "192.0.2.20" });
      assert.equal(response.status, i < 5 ? 200 : 429);
    }
    assert.equal(deliveries, 5);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("exported navigation aliases retain RSC content and MIME headers", async () => {
  const out = path.join(root, ".netlify", "publish");
  const headers = await fs.readFile(path.join(out, "_headers"), "utf8");
  for (const [flat, nested] of [
    ["components/__next.!KHNoZWxsKQ.components.__PAGE__.txt", "components/__next.!KHNoZWxsKQ/components/__PAGE__.txt"],
    ["docs/components/frost/__next.!KHNoZWxsKQ.docs.components.frost.txt", "docs/components/frost/__next.!KHNoZWxsKQ/docs/components/frost.txt"],
  ]) {
    assert.equal(await fs.readFile(path.join(out, flat), "utf8"), await fs.readFile(path.join(out, nested), "utf8"));
    assert.ok(headers.includes(`/${flat}\n  Content-Type: text/x-component; charset=utf-8`));
  }
  assert.ok(headers.includes("/index.txt\n  Content-Type: text/x-component"));
  assert.ok(!headers.includes("/llms.txt\n"));
});
