const db = require('../db');
const { pubClient } = require('../redis');

async function settleDonation(streamerId, payment) {
  // Transaction and durable alert are inserted atomically. Unique tx_hash makes
  // concurrent submissions idempotent; values come exclusively from the verifier.
  const event = { event: 'DONATION', tx_hash: payment.tx_hash, chain: payment.chain,
    amount: payment.amount, currency: payment.currency, sender: payment.sender,
    message: '', timestamp: new Date().toISOString() };
  const { rows } = await db.query(`
    WITH inserted AS (
      INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
      VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
      ON CONFLICT (tx_hash) DO NOTHING RETURNING tx_hash
    )
    INSERT INTO Donation_Outbox (tx_hash, streamer_id, payload)
    SELECT tx_hash, $2, $6::jsonb FROM inserted RETURNING tx_hash`,
  [payment.tx_hash, streamerId, payment.sender, payment.amount, payment.currency, JSON.stringify(event)]);
  return rows.length > 0;
}

function startOutboxWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      // Atomic lease avoids two backend instances publishing the same row at once.
      const { rows } = await db.query(`UPDATE Donation_Outbox SET locked_until = NOW() + INTERVAL '30 seconds'
        WHERE tx_hash IN (SELECT tx_hash FROM Donation_Outbox
          WHERE delivered_at IS NULL AND (locked_until IS NULL OR locked_until < NOW())
          ORDER BY created_at LIMIT 20 FOR UPDATE SKIP LOCKED)
        RETURNING tx_hash, streamer_id, payload`);
      for (const row of rows) {
        const { rows: configs } = await db.query('SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1', [row.streamer_id]);
        await pubClient.publish(`streamer:${row.streamer_id}:events`, JSON.stringify({ ...row.payload, ...configs[0] }));
        await db.query('UPDATE Donation_Outbox SET delivered_at = NOW() WHERE tx_hash = $1', [row.tx_hash]);
      }
    } catch (error) { console.error('[Outbox] Will retry delivery:', error.message); }
    finally { running = false; }
  };
  const timer = setInterval(tick, 2000);
  timer.unref();
  return () => clearInterval(timer);
}
module.exports = { settleDonation, startOutboxWorker };
