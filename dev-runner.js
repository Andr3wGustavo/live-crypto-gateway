const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');

const root = __dirname;
const demo = process.argv.includes('--demo');
const noBrowser = process.argv.includes('--no-browser');
const children = [];
let stopping = false;

async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.filter(child => child.pid).map(child => new Promise(resolve => {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      killer.on('exit', resolve);
      killer.on('error', resolve);
    } else { child.kill('SIGTERM'); resolve(); }
  })));
  process.exit(code);
}

function launch(label, cwd, args) {
  const child = spawn(process.execPath, args, {
    cwd, env: { ...process.env, NODE_ENV: 'development', ...(demo ? { DEV_MEMORY_MODE: 'true', DONATIONS_ENABLED: 'false' } : {}) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => {
    for (const line of data.toString().split(/\r?\n/)) if (line) console.log(`[${label}] ${line}`);
  });
  child.on('error', error => { console.error(`[${label}] ${error.message}`); void shutdown(1); });
  child.on('exit', code => {
    if (!stopping) { console.error(`[${label}] exited (${code}). See the error above.`); void shutdown(code || 1); }
  });
}

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error(`Port ${port} is occupied. Close the earlier Live Crypto terminal and retry.`)));
    probe.listen(port, () => probe.close(resolve));
  });
}

function run(command, args, cwd, message) {
  console.log(message);
  const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
  const result = spawnSync(executable, args, { cwd, stdio: 'inherit' });
  if (result.error) throw new Error(`${command} could not start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed.`);
}

function bootstrap() {
  const packages = [
    { directory: 'frontend', marker: 'next/dist/bin/next' },
    { directory: 'backend', marker: 'express' }
  ];
  for (const pkg of packages) {
    const cwd = path.join(root, pkg.directory);
    if (!fs.existsSync(path.join(cwd, 'node_modules', pkg.marker))) {
      run('npm', ['ci'], cwd, `Installing ${pkg.directory} dependencies...`);
    }
  }
  if (!demo) run('docker', ['compose', 'up', '-d', '--wait'], root, 'Starting PostgreSQL and Redis with Docker Compose...');
}

async function waitFor(url, timeout = 240000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline && !stopping) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      await response.arrayBuffer();
      if (response.ok) return;
      if (response.status >= 500 && url.includes('/health')) throw new Error('Backend dependencies are unhealthy');
    } catch { /* Keep waiting while first compilation completes. */ }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  throw new Error(`Startup timed out: ${url}. Review the server logs above.`);
}

async function main() {
  console.log(`\nLIVE CRYPTO / ${demo ? 'PREVIEW — no real payments, temporary data' : 'FULL — PostgreSQL + Redis required'}\n`);
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Install Node.js 22 or 24 LTS first.');
  bootstrap();
  const next = path.join(root, 'frontend/node_modules/next/dist/bin/next');
  if (!fs.existsSync(next) || !fs.existsSync(path.join(root, 'backend/node_modules/express'))) {
    throw new Error('Dependencies missing. Run npm ci in frontend and backend, then retry.');
  }
  await Promise.all([checkPort(3000), checkPort(8080)]);
  launch('API', path.join(root, 'backend'), ['src/server.js']);
  // Turbopack can stall on Dropbox/OneDrive virtual filesystems. Webpack is
  // slower to boot but stable for the Windows folder this project uses.
  launch('WEB', path.join(root, 'frontend'), [next, 'dev', '--webpack', '--port', '3000']);
  console.log('Waiting for API health and first page compilation (this can take a few minutes)...');
  await Promise.all([waitFor('http://localhost:8080/api/health'), waitFor('http://localhost:3000')]);
  console.log('\nREADY: http://localhost:3000 | API: http://localhost:8080/api/health\nCtrl+C closes both servers.');
  if (!noBrowser) {
    const command = process.platform === 'win32' ? ['cmd.exe', ['/d', '/c', 'start', '', 'http://localhost:3000']] : process.platform === 'darwin' ? ['open', ['http://localhost:3000']] : ['xdg-open', ['http://localhost:3000']];
    const browser = spawn(command[0], command[1], { stdio: 'ignore' });
    browser.on('error', () => console.log('Open http://localhost:3000 in your browser.'));
  }
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
main().catch(error => { console.error(error.message); void shutdown(1); });
