const os = require('node:os');
const { execFileSync } = require('node:child_process');

function assertAvailableMemory(freeBytes = os.freemem(), freeVirtualMB = null) {
  const available = Math.floor(freeBytes / 1024 / 1024);
  if (available < 1024) {
    throw new Error(`Not enough available memory to compile the application (${available} MB free). Close unused apps/tabs and retry. Aim for at least 2 GB free; on Windows also check that the paging file is enabled.`);
  }
  if (freeVirtualMB !== null && freeVirtualMB < 2048) {
    throw new Error(`Windows has only ${Math.floor(freeVirtualMB)} MB of available virtual memory. Compilation needs more headroom. Close unused apps/tabs and enable a system-managed paging file before retrying.`);
  }
  return available;
}

function checkSystemMemory() {
  assertAvailableMemory();
  let freeVirtualMB = null;
  if (process.platform === 'win32') {
    try {
      const output = execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '(Get-CimInstance Win32_OperatingSystem).FreeVirtualMemory'], { encoding:'utf8',timeout:15000,windowsHide:true,stdio:['ignore','pipe','pipe'] });
      freeVirtualMB = Number(output.trim()) / 1024;
      if (!Number.isFinite(freeVirtualMB) || !output.trim()) throw new Error('Invalid memory report');
    } catch {
      throw new Error('Unable to check Windows virtual memory. Close unused apps and retry; Windows must have enough RAM and paging-file capacity to start the compiler.');
    }
  }
  return assertAvailableMemory(os.freemem(), freeVirtualMB);
}

function fatalStartupError(output) {
  if (/Failed to allocate memory|heap out of memory|Allocation failed|Array buffer allocation failed|LLVM ERROR: out of memory|os error 1455/i.test(output)) {
    return 'Frontend compilation ran out of memory. Close unused apps/tabs, check the Windows paging file, and restart start-dev.bat. Increasing the startup timeout or the Node heap limit does not free system memory.';
  }
  return null;
}

async function waitFor(url, { timeout = 600000, healthMode, onProgress = () => {} } = {}) {
  const started = Date.now();
  const deadline = started + timeout;
  let lastProblem = 'server has not responded';
  const progress = setInterval(() => onProgress(Math.round((Date.now() - started) / 1000), lastProblem), 15000);
  progress.unref();
  try {
    while (Date.now() < deadline) {
      let response, body;
      const controller = new AbortController();
      // A cold Next compilation must be allowed to finish. Aborting every 15s
      // repeatedly opened requests while the same compilation was still running.
      const timer = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
      try {
        response = await fetch(url, { signal: controller.signal });
        body = await response.text();
      } catch (error) {
        response = undefined;
        lastProblem = error.cause?.code || error.message;
      } finally { clearTimeout(timer); }
      if (response) {
        if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}. ${healthMode ? 'Check the API/storage error above.' : 'Check the compiler error above and frontend/.next/dev/logs/next-development.log.'}`);
        if (healthMode) {
          let health;
          try { health = JSON.parse(body); }
          catch { throw new Error(`${url} returned invalid health JSON.`); }
          const services = [health.services?.database, health.services?.redis];
          const valid = services.every(value => typeof value === 'string' && (healthMode === 'preview' ? value === 'memory-preview' : value.startsWith('connected')));
          if (health.status !== healthMode || !valid) throw new Error(`Storage mode mismatch: expected ${healthMode} with ${healthMode === 'preview' ? 'temporary' : 'persistent'} database and Redis.`);
        } else if (!/<html[\s>]/i.test(body)) {
          throw new Error(`${url} did not return an HTML page.`);
        }
        return;
      }
      if (Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, Math.min(1500, deadline - Date.now())));
    }
    const advice = healthMode ? 'Check the API logs above. Cold dependency loading in a synced folder can be slow; full mode also requires PostgreSQL and Redis.' : 'Check frontend/.next/dev/logs/next-development.log; close unused apps if it reports a memory error.';
    throw new Error(`Startup timed out after ${Math.round(timeout / 1000)}s: ${url}. Last result: ${lastProblem}. ${advice}`);
  } finally { clearInterval(progress); }
}

module.exports = { assertAvailableMemory, checkSystemMemory, fatalStartupError, waitFor };
