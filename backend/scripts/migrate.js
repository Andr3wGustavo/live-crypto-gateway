const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ host: process.env.POSTGRES_HOST || 'localhost', port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'postgres', password: process.env.POSTGRES_PASSWORD || 'password', database: process.env.POSTGRES_DB || 'livecrypto' });
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(48210621)');
    await client.query('CREATE TABLE IF NOT EXISTS Schema_Migrations (name TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const schema = await client.query("SELECT to_regclass('streamers') AS table_name");
    if (!schema.rows[0].table_name) await client.query(fs.readFileSync(path.join(__dirname, '../../db/init.sql'), 'utf8'));
    const directory = path.join(__dirname, '../../db/migrations');
    for (const name of fs.readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
      const sql = fs.readFileSync(path.join(directory, name), 'utf8').replace(/\r\n/g, '\n');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM Schema_Migrations WHERE name=$1', [name]);
      if (existing.rows.length) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Migration checksum changed: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO Schema_Migrations(name,checksum) VALUES($1,$2)', [name, checksum]);
      console.log(`Applied migration ${name}`);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(48210621)').catch(() => {});
    client.release(); await pool.end();
  }
}
migrate().catch(error => { console.error('Migration failed:', error.message); process.exitCode = 1; });
