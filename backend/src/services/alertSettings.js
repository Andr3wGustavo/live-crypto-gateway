const db = require('../db');
const { pubClient } = require('../redis');

const defaults = Object.freeze({ min_amount:'0', active_theme:'cyberpunk', goal_amount:'0', goal_current:'0', goal_title:'Donation Goal', media_url:null, audio_url:null, position:'bottom-center', sound_preset:'arcade_coin', voice_profile:'cyber_announcer', show_leaderboard:true });
const fields = Object.keys(defaults);
const choices = {
  active_theme:['cyberpunk','matrix','fire','minimal'], position:['top-left','top-right','center','bottom-center','bottom-right'],
  sound_preset:['arcade_coin','cyber_chime','cash_register','laser_beam'], voice_profile:['cyber_announcer','anime_kawaii','scifi_robot','natural_host']
};
function invalid(field) { const error = new Error(`Invalid alert setting: ${field}`); error.status=422; throw error; }
function validatePatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length) invalid('body');
  const patch = {};
  for (const [field,value] of Object.entries(body)) {
    if (!fields.includes(field)) invalid(field);
    if (choices[field] && !choices[field].includes(value)) invalid(field);
    if (['min_amount','goal_amount','goal_current'].includes(field)) {
      if (!['string','number'].includes(typeof value) || !/^\d+(\.\d{1,8})?$/.test(String(value)) || Number(value)>999999999) invalid(field);
    }
    if (field === 'goal_title' && (typeof value !== 'string' || value.length>255)) invalid(field);
    if (field === 'show_leaderboard' && typeof value !== 'boolean') invalid(field);
    if (['media_url','audio_url'].includes(field) && value !== null) {
      if (typeof value !== 'string' || value.length>2048) invalid(field);
      try { const url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password) invalid(field); }
      catch { invalid(field); }
    }
    patch[field] = value;
  }
  return patch;
}

async function saveAlertSettings(streamerId, body) {
  const patch = validatePatch(body);
  // The allowlisted column names are static. Presence, not truthiness, controls
  // updates: zero/false/null must be saved, and omitted fields must be preserved.
  const values = fields.map(field => Object.hasOwn(patch,field) ? patch[field] : defaults[field]);
  const updates = fields.map(field => `${field}=CASE WHEN $13::jsonb ? '${field}' THEN EXCLUDED.${field} ELSE Alert_Configs.${field} END`);
  const { rows } = await db.query(`INSERT INTO Alert_Configs (streamer_id,${fields.join(',')})
    VALUES ($1,${fields.map((_,i)=>`$${i+2}`).join(',')})
    ON CONFLICT(streamer_id) DO UPDATE SET ${updates.join(',')}
    RETURNING ${fields.join(',')}`, [streamerId,...values,JSON.stringify(Object.keys(patch))]);
  return rows[0];
}

async function notifyAlertSettings(streamerId, config) {
  try {
    await pubClient.publish(`streamer:${streamerId}:events`, JSON.stringify({ event:'CONFIG_UPDATE', ...config,
      theme:config.active_theme, goal_amount:Number(config.goal_amount), goal_current:Number(config.goal_current) }));
    // Publication is not proof of OBS receipt/display.
    return true;
  } catch { return false; }
}
module.exports = { defaults, fields, validatePatch, saveAlertSettings, notifyAlertSettings };
