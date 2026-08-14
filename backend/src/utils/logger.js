const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');
const errorFile = path.join(logsDir, 'error.log');

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
}

function writeToFile(filePath, logLine) {
  fs.appendFile(filePath, logLine + '\n', (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
}

const logger = {
  info: (message, meta = {}) => {
    const formatted = formatLog('info', message, meta);
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`, Object.keys(meta).length ? meta : '');
    writeToFile(logFile, formatted);
  },
  warn: (message, meta = {}) => {
    const formatted = formatLog('warn', message, meta);
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, Object.keys(meta).length ? meta : '');
    writeToFile(logFile, formatted);
  },
  error: (message, error = null, meta = {}) => {
    const errorMeta = error ? { ...meta, error: error.message || error, stack: error.stack } : meta;
    const formatted = formatLog('error', message, errorMeta);
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, errorMeta);
    writeToFile(errorFile, formatted);
    writeToFile(logFile, formatted);
  },
  audit: (action, streamerId, details = {}) => {
    const formatted = formatLog('audit', `ACTION: ${action} | Streamer: ${streamerId}`, details);
    console.log(`\x1b[35m[AUDIT]\x1b[0m ${action} (Streamer: ${streamerId})`, details);
    writeToFile(logFile, formatted);
  }
};

module.exports = logger;
