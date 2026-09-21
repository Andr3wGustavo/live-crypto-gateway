const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/db');
const { settleDonation } = require('../src/services/settlement');

test('PostgreSQL atomically deduplicates concurrent settlements and retains 18 decimal places', { skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL to run the real PostgreSQL integration test' }, async t => {
  const schema = `test_${Date.now()}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await pool.query(fs.readFileSync(path.join(__dirname, '../../db/init.sql'), 'utf8'));
    await pool.query("INSERT INTO Streamers (public_address) VALUES ('test')");
    t.mock.method(db, 'query', (sql, values) => pool.query(sql, values));
    const payment = { tx_hash: 'test-hash', sender: 'test-sender', amount: '0.000000000000000001', currency: 'ETH', chain: '84532' };
    const results = await Promise.all([settleDonation(1, payment), settleDonation(1, payment)]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await pool.query('SELECT * FROM Donation_Outbox')).rows.length, 1);
    assert.equal((await pool.query('SELECT amount FROM Transactions')).rows[0].amount, payment.amount);
    await assert.rejects(settleDonation(999, { ...payment, tx_hash: 'invalid-creator' }));
    assert.equal((await pool.query('SELECT * FROM Transactions')).rows.length, 1);
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
    await db.close();
  }
});
