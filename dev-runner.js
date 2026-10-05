const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const { checkSystemMemory, fatalStartupError, waitFor } = require('./scripts/startup-checks');

const root = __dirname;
const options = process.argv.slice(2);
const demo = !options.includes('--full');
const noBrowser = process.argv.includes('--no-browser');
const checkOnly = options.includes('--check');
const children = [];
let stopping = false;

async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  // Stop the compiler first and avoid launching several taskkill processes at
  // once when Windows is already out of commit memory.
  for (const child of [...children].reverse().filter(child => child.pid && child.exitCode === null && child.signalCode === null)) {
    await new Promise(resolve => {
      const fallback = () => {
        try { child.kill('SIGTERM'); } catch { /* The child may already have exited. */ }
        resolve();
      };
      if (process.platform !== 'win32') { fallback(); return; }
      try {
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio:'ignore',windowsHide:true });
        const timeout = setTimeout(() => { try { killer.kill(); } catch {} fallback(); }, 10000);
        killer.once('exit', result => { clearTimeout(timeout); if (result) fallback(); else resolve(); });
        killer.once('error', () => { clearTimeout(timeout); fallback(); });
      } catch { fallback(); }
    });
  }
  process.exit(code);
}

function launch(label, cwd, args) {
  const child = spawn(process.execPath, args, {
    cwd, env: { ...process.env, NODE_ENV: 'development', PORT: '8080', DEV_MEMORY_MODE: String(demo), ...(label === 'WEB' ? { LIVECRYPTO_LOCAL_DEV: 'true' } : {}), ...(demo ? { DONATIONS_ENABLED: 'false' } : {}) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) {
    let tail = '';
    stream.on('data', data => {
      const text = data.toString();
      for (const line of text.split(/\r?\n/)) if (line) console.log(`[${label}] ${line}`);
      const fatal = fatalStartupError(tail + text);
      tail = (tail + text).slice(-512);
      if (fatal && !stopping) { console.error(`\n${fatal}`); void shutdown(1); }
    });
  }
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
  // Windows batch shims require cmd.exe; spawning npm.cmd directly fails with
  // EINVAL. Only npm's fixed, internal arguments go through the command shell.
  const windowsNpm = process.platform === 'win32' && command === 'npm';
  const executable = windowsNpm ? 'cmd.exe' : command;
  const commandArgs = windowsNpm ? ['/d', '/c', 'npm.cmd', ...args] : args;
  const result = spawnSync(executable, commandArgs, { cwd, stdio: 'inherit' });
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
  if (!demo) {
    run('docker', ['compose', 'up', '-d', '--wait'], root, 'Starting PostgreSQL and Redis with Docker Compose...');
    run('node', ['scripts/migrate.js'], path.join(root, 'backend'), 'Applying versioned database migrations...');
  }
}

async function main() {
  const supported = ['--full', '--demo', '--no-browser', '--check', '--help'];
  if (options.some(option => !supported.includes(option)) || (options.includes('--full') && options.includes('--demo'))) {
    throw new Error('Invalid options. Use start-dev.bat --help.');
  }
  if (options.includes('--help')) {
    console.log('Usage: start-dev.bat [--full] [--no-browser] [--check]\nDefault: safe memory preview. --full: Docker PostgreSQL + Redis.\n--check: verify startup and close the application servers; Docker containers remain running.');
    return;
  }
  console.log(`\nLIVE CRYPTO / ${demo ? 'PREVIEW — no real payments, temporary data' : 'FULL — PostgreSQL + Redis required'}\n`);
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Install Node.js 22 or 24 LTS first.');
  await Promise.all([checkPort(3000), checkPort(8080)]);
  console.log(`Available RAM: ${checkSystemMemory()} MB. First compilation works best with at least 2 GB free.`);
  bootstrap();
  const next = path.join(root, 'frontend/node_modules/next/dist/bin/next');
  if (!fs.existsSync(next) || !fs.existsSync(path.join(root, 'backend/node_modules/express'))) {
    throw new Error('Dependencies missing. Run npm ci in frontend and backend, then retry.');
  }
  launch('API', path.join(root, 'backend'), ['src/server.js']);
  console.log('Waiting for API and storage...');
  await waitFor('http://localhost:8080/api/health', { timeout: 240000, healthMode: demo ? 'preview' : 'ok', onProgress: seconds => console.log(`[API] Loading dependencies / waiting for storage (${seconds}s)...`) });
  console.log('API ready. Starting frontend...');
  // Turbopack can stall on Dropbox/OneDrive virtual filesystems. Webpack is
  // slower to boot but stable for the Windows folder this project uses.
  launch('WEB', path.join(root, 'frontend'), [next, 'dev', '--webpack', '--port', '3000']);
  console.log('Waiting for the first page compilation (up to 10 minutes on a cold synced folder)...');
  await waitFor('http://localhost:3000', { onProgress: seconds => console.log(`[WEB] Waiting for compiled HTML (${seconds}s). Keep this terminal open.`) });
  if (checkOnly) {
    console.log('Checking localized routes, redirects, metadata and API access...');
    await new Promise((resolve, reject) => {
      const check = spawn(process.execPath, ['--experimental-strip-types', '--test', 'tests/i18n-http.test.mjs'], {
        cwd: path.join(root, 'frontend'), env: { ...process.env, I18N_TEST_URL: 'http://localhost:3000' }, stdio: 'inherit'
      });
      children.push(check);
      check.on('error', reject);
      check.on('exit', code => code === 0 ? resolve() : reject(new Error(`Localized page checks failed (${code}).`)));
    });
  }
  console.log('\nREADY: http://localhost:3000 | API: http://localhost:8080/api/health\nCtrl+C closes both servers.');
  if (checkOnly) { await shutdown(0); return; }
  if (!noBrowser) {
    const command = process.platform === 'win32' ? ['cmd.exe', ['/d', '/c', 'start', '', 'http://localhost:3000']] : process.platform === 'darwin' ? ['open', ['http://localhost:3000']] : ['xdg-open', ['http://localhost:3000']];
    const browser = spawn(command[0], command[1], { stdio: 'ignore' });
    browser.on('error', () => console.log('Open http://localhost:3000 in your browser.'));
  }
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
main().catch(error => { console.error(error.message); void shutdown(1); });
