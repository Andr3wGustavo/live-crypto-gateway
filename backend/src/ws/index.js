const WebSocket = require('ws');
const db = require('../db');
const { subClient } = require('../redis');

// Streamer connection pool: Map<streamerId, Set<WebSocket>>
const streamerConnections = new Map();

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    // Extract obs_token from the URL, e.g., ws://localhost:8080/?obs_token=UUID
    const url = new URL(req.url, `http://${req.headers.host}`);
    const obsToken = url.searchParams.get('obs_token');

    if (!obsToken) {
      ws.close(1008, 'obs_token missing');
      return;
    }

    try {
      // Validate token against db
      const { rows } = await db.query('SELECT id, public_address FROM Streamers WHERE obs_token = $1', [obsToken]);
      if (rows.length === 0) {
        ws.close(1008, 'Invalid obs_token');
        return;
      }

      const streamerId = rows[0].id;
      const channel = `streamer:${streamerId}:events`;

      console.log(`WebSocket connected for streamer: ${rows[0].public_address} (ID: ${streamerId})`);

      // Add ws to streamer's connection pool
      if (!streamerConnections.has(streamerId)) {
        streamerConnections.set(streamerId, new Set());

        // First connection for this streamer: Subscribe to Redis channel
        await subClient.subscribe(channel, (message) => {
          const clientSet = streamerConnections.get(streamerId);
          if (clientSet) {
            for (const client of clientSet) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            }
          }
        });
        console.log(`Subscribed to Redis channel: ${channel}`);
      }

      streamerConnections.get(streamerId).add(ws);

      // Handle disconnection safely
      ws.on('close', async () => {
        const clientSet = streamerConnections.get(streamerId);
        if (clientSet) {
          clientSet.delete(ws);
          console.log(`WebSocket disconnected for streamer ID: ${streamerId} (${clientSet.size} client(s) remaining)`);

          // Only unsubscribe if all clients for this streamer disconnected
          if (clientSet.size === 0) {
            streamerConnections.delete(streamerId);
            try {
              await subClient.unsubscribe(channel);
              console.log(`Unsubscribed from Redis channel: ${channel}`);
            } catch (err) {
              console.error(`Error unsubscribing channel ${channel}:`, err);
            }
          }
        }
      });

      // Fetch initial configurations
      const configRes = await db.query(
        `SELECT min_amount, media_url, audio_url, active_theme, goal_amount, goal_current, goal_title 
         FROM Alert_Configs WHERE streamer_id = $1`,
        [streamerId]
      );
      
      const initialConfig = configRes.rows[0] || {
        active_theme: 'cyberpunk',
        goal_amount: 0,
        goal_current: 0,
        goal_title: 'Donation Goal',
        media_url: null,
        audio_url: null
      };
      
      // Send welcome event and initial configuration
      ws.send(JSON.stringify({ 
        event: "CONNECTED", 
        message: "Successfully connected to Live Crypto WS",
        config: {
          theme: initialConfig.active_theme,
          goal_amount: parseFloat(initialConfig.goal_amount || 0),
          goal_current: parseFloat(initialConfig.goal_current || 0),
          goal_title: initialConfig.goal_title,
          media_url: initialConfig.media_url,
          audio_url: initialConfig.audio_url
        }
      }));

    } catch (err) {
      console.error('WS Connection Error:', err);
      ws.close(1011, 'Internal Server Error');
    }
  });

  return wss;
}

module.exports = {
  initWebSocket
};

