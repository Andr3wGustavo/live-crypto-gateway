const { spawn, exec } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('\x1b[36m%s\x1b[0m', '====================================================================');
console.log('\x1b[36m%s\x1b[0m', '  ⚡ LIVE CRYPTO GATEWAY — SERVIDOR UNIFICADO (TERMINAL ÚNICO)     ');
console.log('\x1b[36m%s\x1b[0m', '====================================================================\n');

// Prefix formatting helper
function pipeLogs(child, prefix, colorCode) {
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colorCode}${prefix}\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.includes('warning') && !line.includes('Fast Refresh')) {
        console.error(`\x1b[31m${prefix}[ERR]\x1b[0m ${line}`);
      }
    });
  });
}

// 1. Launch Backend Server (:8080)
console.log('\x1b[33m%s\x1b[0m', '[1/2] Iniciando Backend API & WebSockets (:8080)...');
const backend = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: backendDir,
  env: { ...process.env, PORT: '8080', NODE_ENV: 'development' }
});
pipeLogs(backend, '[BACKEND]', '\x1b[36m');

// 2. Launch Frontend Server (:3000)
console.log('\x1b[33m%s\x1b[0m', '[2/2] Iniciando Frontend Next.js Web App (:3000)...');
const frontend = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: frontendDir,
  env: { ...process.env, PORT: '3000' }
});
pipeLogs(frontend, '[FRONTEND]', '\x1b[32m');

// 3. Open Browser automatically after 4 seconds
setTimeout(() => {
  console.log('\n\x1b[35m%s\x1b[0m', '🚀 Abrindo navegador em http://localhost:3000...\n');
  const openCmd = process.platform === 'win32' ? 'start http://localhost:3000' :
                  process.platform === 'darwin' ? 'open http://localhost:3000' : 'xdg-open http://localhost:3000';
  exec(openCmd);
}, 4000);

// Handle clean exit on Ctrl+C
function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Encerrando servidores do Live Crypto com segurança...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
