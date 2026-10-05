const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/db');
const { settleDonation } = require('../src/services/settlement');
const { reconcileIntent, getIntent, submitHash, hashToken } = require('../src/services/paymentIntents');
const { routerInterface } = require('../src/services/chainVerifier');

test('persistent intents: attribution, concurrency, precision, discovery and restart-safe cursors', { skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL for PostgreSQL integration' }, async t => {
  const schema = `payments_${Date.now()}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
  const sender = '0x1111111111111111111111111111111111111111';
  const recipient = '0x2222222222222222222222222222222222222222';
  const router = '0x3333333333333333333333333333333333333333';
  const token = 'a'.repeat(64);
  const seed = async (creator = 1, gross = '1') => {
    const id = randomUUID();
    const { rows } = await pool.query(`INSERT INTO Payment_Intents(id,access_hash,streamer_id,chain_id,sender_address,recipient_address,gross_amount,currency,memo,router_address,fee_bps,confirmations,scan_block)
      VALUES($1,$2,$3,'80002',$4,$5,$6,'POL',$7,$8,200,3,90) RETURNING *`, [id,hashToken(token),creator,sender,recipient,gross,`lc:${id}`,router]);
    return rows[0];
  };
  const payment = (intent, hash = `0x${'1'.repeat(64)}`) => ({ verified:true,status:'CONFIRMED',tx_hash:hash,chain:'80002',sender,recipient,gross_amount:'1',amount:'0.98',fee:'0.02',currency:'POL',memo:intent.memo });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await pool.query(fs.readFileSync(path.join(__dirname, '../../db/init.sql'), 'utf8'));
    await pool.query(fs.readFileSync(path.join(__dirname, '../../db/migrations/002_payment_intents.sql'), 'utf8'));
    await pool.query("INSERT INTO Streamers(public_address) VALUES('creator-one'),('creator-two')");
    t.mock.method(db, 'query', (sql, values) => pool.query(sql, values));
    const intent = await seed();
    assert.equal((await getIntent(intent.id, token)).streamer_id, 1);
    await assert.rejects(getIntent(intent.id, 'b'.repeat(64)), /INTENT_NOT_FOUND/);
    await assert.rejects(submitHash(intent.id, 'b'.repeat(64), `0x${'1'.repeat(64)}`), /INTENT_NOT_FOUND/);
    assert.equal(await settleDonation(2, payment(intent), intent.id), false, 'another creator cannot claim an intent');
    assert.equal(await settleDonation(1, { ...payment(intent), memo:'lc:forged' }, intent.id), false);
    assert.equal(await settleDonation(1, { ...payment(intent), sender:router }, intent.id), false);
    const result = await Promise.all([settleDonation(1,payment(intent),intent.id),settleDonation(1,payment(intent),intent.id)]);
    assert.equal(result.filter(Boolean).length, 1);
    assert.equal((await pool.query('SELECT * FROM Donation_Outbox')).rows.length, 1);
    assert.equal((await getIntent(intent.id, token)).status, 'CONFIRMED');
    const tiny = await seed(1, '0.000000000000000001');
    await settleDonation(1,{ ...payment(tiny, `0x${'2'.repeat(64)}`), amount:'0.000000000000000001',gross_amount:'0.000000000000000001',fee:'0' },tiny.id);
    assert.equal((await pool.query('SELECT amount FROM Transactions WHERE intent_id=$1',[tiny.id])).rows[0].amount,'0.000000000000000001');

    const missingHash = await seed();
    const event = routerInterface.encodeEventLog(routerInterface.getEvent('DonationRouted'), [sender,recipient,1000000000000000000n,20000000000000000n,980000000000000000n,'0x0000000000000000000000000000000000000000',missingHash.memo]);
    const rpc = { getNetwork:async()=>({chainId:80002n}), getBlockNumber:async()=>100,
      getLogs:async()=>[{...event,transactionHash:`0x${'3'.repeat(64)}`}] };
    let attempts = 0;
    const verifier = { verifyTransaction:async expected => {
      assert.equal(expected.expected_memo, missingHash.memo);
      assert.equal(expected.expected_sender, sender);
      attempts++;
      return attempts===1 ? {verified:false,status:'ERROR'} : payment(missingHash,expected.tx_hash);
    } };
    await assert.rejects(reconcileIntent(missingHash,{ provider:rpc,verifier }),/VERIFICATION_RETRY/);
    assert.equal((await getIntent(missingHash.id,token)).scan_block,'90','RPC failure must not advance discovery cursor');
    await reconcileIntent(await getIntent(missingHash.id,token),{ provider:rpc,verifier });
    assert.equal((await getIntent(missingHash.id,token)).status,'CONFIRMED','discovery settles without any browser hash submission');
    assert.equal((await pool.query('SELECT count(*) FROM Transactions')).rows[0].count,'3');
    assert.equal((await pool.query('SELECT count(*) FROM Donation_Outbox WHERE acknowledged_at IS NULL')).rows[0].count,'3');
  } finally {
    await pool.end(); await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await admin.end(); await db.close();
  }
});
