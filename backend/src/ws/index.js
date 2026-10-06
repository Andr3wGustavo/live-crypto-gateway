const WebSocket = require('ws');
const { randomUUID } = require('node:crypto');
const db = require('../db');
const { subClient } = require('../redis');

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server, maxPayload: 4096 });
  const groups = new Map();
  wss.on('connection', async (ws, req) => {
    const token = new URL(req.url, 'http://localhost').searchParams.get('obs_token');
    if (!token || token.length > 100) { ws.close(1008, 'Invalid OBS token'); return; }
    const owner = randomUUID();
    let streamerId, channel, inflight = null, pumping = false, messages = 0;
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('error', () => ws.terminate());
    const send = payload => {
      if (ws.readyState !== WebSocket.OPEN) return false;
      if (ws.bufferedAmount >= 1024 * 1024) {
        // A silent drop would leave an event in-flight forever. Close the slow
        // consumer so its normal reconnect replays the unacknowledged row.
        ws.close(1013, 'Slow consumer; reconnect for replay');
        return false;
      }
      ws.send(JSON.stringify(payload));
      return true;
    };
    async function pump() {
      if (db.isMemory || !streamerId || pumping || ws.readyState !== WebSocket.OPEN) return;
      pumping = true;
      try {
        const valid = await db.query('SELECT id FROM Streamers WHERE id=$1 AND obs_token=$2', [streamerId, token]);
        if (!valid.rows.length) { ws.close(1008, 'OBS token revoked'); return; }
        const lease = await db.query(`INSERT INTO Alert_Consumers(streamer_id,owner,expires_at) VALUES($1,$2,NOW()+INTERVAL '20 seconds')
          ON CONFLICT(streamer_id) DO UPDATE SET owner=EXCLUDED.owner,expires_at=EXCLUDED.expires_at
          WHERE Alert_Consumers.expires_at<NOW() OR Alert_Consumers.owner=$2 RETURNING owner`, [streamerId, owner]);
        if (!lease.rows.length || inflight) return;
        const { rows } = await db.query(`SELECT o.event_id,o.payload,c.media_url,c.audio_url FROM Donation_Outbox o
          LEFT JOIN Alert_Configs c ON c.streamer_id=o.streamer_id
          WHERE o.streamer_id=$1 AND o.acknowledged_at IS NULL ORDER BY o.event_id LIMIT 1`, [streamerId]);
        if (rows.length) {
          const row = rows[0], id = String(row.event_id);
          if (send({ ...row.payload, event_id: id, media_url: row.media_url, audio_url: row.audio_url })) inflight = id;
        }
      } catch (error) { console.error('[OBS replay]', error.message); }
      finally { pumping = false; }
    }
    ws.on('message', async raw => {
      if (++messages > 30) { ws.close(1008, 'Message limit'); return; }
      try {
        const message = JSON.parse(raw.toString());
        if (message.event !== 'ACK' || !inflight || String(message.event_id) !== inflight) return;
        await db.query('UPDATE Donation_Outbox SET acknowledged_at=NOW() WHERE streamer_id=$1 AND event_id=$2 AND acknowledged_at IS NULL', [streamerId, inflight]);
        inflight = null; await pump();
      } catch { ws.close(1008, 'Invalid acknowledgement'); }
    });
    const interval = setInterval(() => { messages = 0; if (!ws.alive) { ws.terminate(); return; } ws.alive = false; ws.ping(); void pump(); }, 10000);
    interval.unref();
    ws.on('close', async () => {
      clearInterval(interval);
      const group = groups.get(streamerId);
      if (group) {
        group.delete(ws);
        if (!group.size) { groups.delete(streamerId); await subClient.unsubscribe(channel).catch(() => {}); }
      }
      if (!db.isMemory && streamerId) await db.query('DELETE FROM Alert_Consumers WHERE streamer_id=$1 AND owner=$2', [streamerId, owner]).catch(() => {});
    });
    try {
      const { rows } = await db.query('SELECT id, public_address FROM Streamers WHERE obs_token = $1', [token]);
      if (!rows.length || ws.readyState !== WebSocket.OPEN) { ws.close(1008, 'Invalid OBS token'); return; }
      streamerId = rows[0].id;
      channel = `streamer:${streamerId}:events`;
      if (!groups.has(streamerId)) {
        const group = new Map(); groups.set(streamerId, group);
        await subClient.subscribe(channel, raw => {
          let event;
          try { event = JSON.parse(raw); } catch { return; }
          for (const [socket, subscriber] of group) {
            if (event.event === 'TOKEN_ROTATED') { socket.close(1008, 'OBS token revoked'); continue; }
            if (event.event === 'DONATION' && !event.is_test && !db.isMemory) void subscriber.pump();
            else subscriber.send(event);
          }
        });
      }
      groups.get(streamerId).set(ws, { pump, send });
      const { rows: configs } = await db.query('SELECT * FROM Alert_Configs WHERE streamer_id=$1', [streamerId]);
      const config = configs[0] || {};
      send({ event: 'CONNECTED', config: { ...config, theme: config.active_theme || 'cyberpunk', goal_amount: Number(config.goal_amount || 0), goal_current: Number(config.goal_current || 0) } });
      await pump();
    } catch (error) { console.error('[OBS connect]', error.message); ws.close(1011, 'Connection unavailable'); }
  });
  return wss;
}
module.exports = { initWebSocket };
