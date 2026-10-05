const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { assertAvailableMemory, fatalStartupError, waitFor } = require('../scripts/startup-checks');

async function serve(t, handler) {
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  return `http://127.0.0.1:${server.address().port}`;
}

test('memory exhaustion gets an actionable diagnostic instead of a timeout', () => {
  assert.throws(() => assertAvailableMemory(250 * 1024 ** 2), /Not enough available memory/);
  assert.equal(assertAvailableMemory(2048 * 1024 ** 2), 2048);
  assert.throws(() => assertAvailableMemory(2048 * 1024 ** 2, 700), /available virtual memory/);
  assert.equal(assertAvailableMemory(2048 * 1024 ** 2, 4096), 2048);
  assert.match(fatalStartupError('RangeError: Failed to allocate memory'), /paging file/);
  assert.equal(fatalStartupError('Compiling /[locale] ...'), null);
});
test('a slow streamed compilation finishes before readiness; only one request is made', async t => {
  let requests = 0;
  const url = await serve(t, (_req, res) => { requests++; res.writeHead(200); res.write('<html>'); setTimeout(() => res.end('ready</html>'), 100); });
  await waitFor(url, { timeout: 1000 });
  assert.equal(requests, 1);
});
test('compiler errors fail immediately instead of retrying until timeout', async t => {
  const url = await serve(t, (_req, res) => { res.writeHead(500); res.end('Compilation failed'); });
  await assert.rejects(waitFor(url, { timeout: 1000 }), /HTTP 500/);
});
test('stalled HTML response is cancelled at the deadline', async t => {
  const url = await serve(t, (_req, res) => { res.writeHead(200); res.write('<html>'); });
  await assert.rejects(waitFor(url, { timeout: 150 }), /Startup timed out/);
});
test('persistent startup cannot accept preview storage or malformed health', async t => {
  const url = await serve(t, (_req, res) => res.end(JSON.stringify({ status:'preview',services:{database:'memory-preview',redis:'memory-preview'} })));
  await waitFor(url, { timeout: 1000, healthMode:'preview' });
  await assert.rejects(waitFor(url, { timeout: 1000, healthMode:'ok' }), /Storage mode mismatch/);
  const invalid = await serve(t, (_req, res) => res.end('<html>not health</html>'));
  await assert.rejects(waitFor(invalid, { timeout: 1000, healthMode:'preview' }), /invalid health JSON/);
});
