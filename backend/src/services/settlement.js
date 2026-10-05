const db = require('../db');
const { pubClient } = require('../redis');

async function settleDonation(streamerId, payment, intentId) {
  if (!intentId || !payment.verified || payment.status !== 'CONFIRMED') throw new Error('Verified payment intent required');
  const event = { event: 'DONATION', tx_hash: payment.tx_hash, chain: payment.chain,
    amount: payment.amount, currency: payment.currency, sender: payment.sender,
    message: '', timestamp: new Date().toISOString() };
  // One statement: credit + durable alert + confirmed intent commit atomically.
  const { rows } = await db.query(`WITH inserted AS (
      INSERT INTO Transactions (chain_id, tx_hash, intent_id, streamer_id, sender_address, recipient_address, amount, gross_amount, platform_fee, currency, status)
      SELECT chain_id, $1, id, streamer_id, sender_address, recipient_address, $2, gross_amount, $3, currency, 'CONFIRMED'
      FROM Payment_Intents WHERE id=$4 AND streamer_id=$5 AND chain_id=$6 AND status <> 'CONFIRMED'
        AND gross_amount=$7 AND memo=$8 AND gross_amount=$2::numeric+$3::numeric AND $2::numeric>0 AND $3::numeric>=0
        AND (CASE WHEN chain_id LIKE 'solana%' THEN sender_address=$10 AND recipient_address=$11
          ELSE LOWER(sender_address)=LOWER($10) AND LOWER(recipient_address)=LOWER($11) END)
      ON CONFLICT DO NOTHING RETURNING chain_id, tx_hash, intent_id
    ), queued AS (
      INSERT INTO Donation_Outbox(chain_id,tx_hash,streamer_id,payload)
      SELECT chain_id,tx_hash,$5,$9::jsonb FROM inserted RETURNING event_id
    )
    UPDATE Payment_Intents SET status='CONFIRMED',tx_hash=$1,locked_until=NULL,last_error=NULL
    WHERE id IN (SELECT intent_id FROM inserted) RETURNING id`,
  [payment.tx_hash, payment.amount, payment.fee, intentId, streamerId, payment.chain, payment.gross_amount, payment.memo, JSON.stringify(event), payment.sender, payment.recipient]);
  return rows.length > 0;
}

function startOutboxWorker() {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const { rows } = await db.query(`UPDATE Donation_Outbox SET locked_until=NOW()+INTERVAL '15 seconds'
        WHERE event_id IN (SELECT event_id FROM Donation_Outbox WHERE acknowledged_at IS NULL
          AND (locked_until IS NULL OR locked_until<NOW()) ORDER BY event_id LIMIT 20 FOR UPDATE SKIP LOCKED)
        RETURNING event_id, streamer_id, payload`);
      for (const row of rows) {
        await pubClient.publish(`streamer:${row.streamer_id}:events`, JSON.stringify({ ...row.payload, event_id: String(row.event_id) }));
        // Publication is diagnostic only; ACK from an authenticated OBS source
        // is the delivery condition. Offline rows remain eligible for replay.
        await db.query('UPDATE Donation_Outbox SET delivered_at=NOW() WHERE event_id=$1', [row.event_id]);
      }
    } catch (error) { console.error('[Outbox] Retry scheduled:', error.message); }
    finally { running = false; }
  }, 2000);
  timer.unref();
  return () => clearInterval(timer);
}
module.exports = { settleDonation, startOutboxWorker };
