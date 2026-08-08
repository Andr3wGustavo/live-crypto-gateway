const WebSocket = require('ws');
const db = require('../db');
const { subClient } = require('../redis');

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    // Extract obs_token from the URL, e.g., ws://localhost:3000/?obs_token=UUID
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

      // Subscribe to Redis channel for this streamer
      await subClient.subscribe(channel, (message) => {
        // message is a JSON string of the event payload
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      ws.on('close', async () => {
        console.log(`WebSocket disconnected for streamer ID: ${streamerId}`);
        await subClient.unsubscribe(channel);
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
