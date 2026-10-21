const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function worker() {
  const handlers = {}, deleted = [], writes = [];
  const cache = { match: async () => undefined, put: async request => writes.push(request.url), keys: async () => [], delete: async () => true };
  const self = { location: { origin: 'https://app.example.test' }, clients: { claim: async () => undefined }, skipWaiting() {}, addEventListener: (name, callback) => { handlers[name] = callback; } };
  const caches = { open: async () => cache, keys: async () => ['legacy-private-api-cache', 'studentsenior-public-static-v1'], delete: async name => deleted.push(name) };
  const fetch = async () => ({ ok: true, type: 'basic', headers: new Headers(), clone() { return this; } });
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/sw.js'), 'utf8'), { self, caches, URL, fetch });
  return { handlers, deleted, writes };
}
test('worker never intercepts API, authenticated, navigation, PDF or cross-origin requests', async () => {
  const { handlers, writes } = worker();
  const request = (url, options = {}) => ({ url, method: 'GET', mode: 'cors', headers: new Headers(), ...options });
  for (const candidate of [
    request('https://app.example.test/api/v2/auth/user'),
    request('https://app.example.test/wallet', { mode: 'navigate' }),
    request('https://app.example.test/private.pdf'),
    request('https://cdn.example.test/_next/static/chunk.js'),
    request('https://app.example.test/_next/static/chunk.js', { headers: new Headers({ authorization: 'Bearer local-fixture' }) }),
    request('https://app.example.test/manifest.json', { method: 'POST' }),
  ]) {
    let intercepted = false;
    handlers.fetch({ request: candidate, respondWith() { intercepted = true; } });
    assert.equal(intercepted, false);
  }
  let promise;
  handlers.fetch({ request: request('https://app.example.test/_next/static/chunk.js'), respondWith(value) { promise = value; } });
  await promise;
  assert.deepEqual(writes, ['https://app.example.test/_next/static/chunk.js']);
});
test('activation removes obsolete caches containing account data', async () => {
  const { handlers, deleted } = worker();
  let promise; handlers.activate({ waitUntil(value) { promise = value; } }); await promise;
  assert.deepEqual(deleted, ['legacy-private-api-cache']);
});
