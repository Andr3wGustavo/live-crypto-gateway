process.env.DEV_MEMORY_MODE = 'true';
process.env.NODE_ENV = 'test';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const WebSocket = require('ws');
const db = require('../src/db');
const { pubClient } = require('../src/redis');
const { initWebSocket } = require('../src/ws');

async function waitFor(predicate) {
  const deadline = Date.now()+30000;
  while (Date.now()<deadline) { const result = await predicate(); if (result) return result; await new Promise(resolve=>setTimeout(resolve,20)); }
  throw new Error('Timed out waiting for OBS delivery state');
}
test('OBS persists offline alerts, replays before ACK, advances in order and revokes rotated connections', { skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL for durable OBS integration' }, async t => {
  const schema = `obs_${Date.now()}`;
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options:`-c search_path=${schema},public` });
  const previousMemory = db.isMemory;
  let server,wss;
  const sockets=[];
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await pool.query(fs.readFileSync(path.join(__dirname,'../../db/init.sql'),'utf8'));
    await pool.query(fs.readFileSync(path.join(__dirname,'../../db/migrations/002_payment_intents.sql'),'utf8'));
    t.mock.method(db,'query',(sql,values)=>pool.query(sql,values)); db.isMemory=false;
    const creator = (await pool.query("INSERT INTO Streamers(public_address) VALUES('creator') RETURNING *")).rows[0];
    for (const hash of ['one','two']) {
      await pool.query("INSERT INTO Transactions(chain_id,tx_hash,streamer_id,sender_address,amount,currency,status) VALUES('80002',$1,$2,'donor',1,'POL','CONFIRMED')",[hash,creator.id]);
      await pool.query("INSERT INTO Donation_Outbox(chain_id,tx_hash,streamer_id,payload) VALUES('80002',$1,$2,$3)",[hash,creator.id,JSON.stringify({event:'DONATION',tx_hash:hash,amount:'1',currency:'POL',sender:'donor'})]);
    }
    server=http.createServer(); wss=initWebSocket(server); server.listen(0,'127.0.0.1'); await once(server,'listening');
    const connect=async()=>{
      const socket=new WebSocket(`ws://127.0.0.1:${server.address().port}/?obs_token=${creator.obs_token}`);
      socket.events=[]; socket.on('message',raw=>socket.events.push(JSON.parse(raw))); sockets.push(socket); await once(socket,'open'); return socket;
    };
    const first=await connect();
    const original=await waitFor(()=>first.events.find(event=>event.event==='DONATION'));
    assert.equal(original.tx_hash,'one');
    assert.equal((await pool.query('SELECT acknowledged_at FROM Donation_Outbox WHERE event_id=$1',[original.event_id])).rows[0].acknowledged_at,null);
    first.close(); await once(first,'close');
    const second=await connect();
    const replay=await waitFor(()=>second.events.find(event=>event.event==='DONATION'));
    assert.equal(replay.event_id,original.event_id);
    second.send(JSON.stringify({event:'ACK',event_id:replay.event_id}));
    await waitFor(async()=>!!(await pool.query('SELECT acknowledged_at FROM Donation_Outbox WHERE event_id=$1',[replay.event_id])).rows[0].acknowledged_at);
    const next=await waitFor(()=>second.events.find(event=>event.tx_hash==='two'));
    assert.notEqual(next.event_id,replay.event_id);
    await pool.query('UPDATE Streamers SET obs_token=uuid_generate_v4() WHERE id=$1',[creator.id]);
    const closed=once(second,'close');
    await pubClient.publish(`streamer:${creator.id}:events`,JSON.stringify({event:'TOKEN_ROTATED'}));
    assert.equal((await closed)[0],1008);
    assert.equal((await pool.query('SELECT acknowledged_at FROM Donation_Outbox WHERE event_id=$1',[next.event_id])).rows[0].acknowledged_at,null);
  } finally {
    for(const socket of sockets) socket.terminate();
    if(wss) await new Promise(resolve=>wss.close(resolve));
    if(server) await new Promise(resolve=>server.close(resolve));
    await pool.end(); await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await admin.end(); db.isMemory=previousMemory; await db.close();
  }
});
