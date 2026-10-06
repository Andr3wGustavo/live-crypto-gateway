const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { pubClient } = require('../redis');
const cookieName = process.env.NODE_ENV === 'production' ? '__Host-livecrypto_session' : 'livecrypto_session';
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' };
const secret = () => process.env.JWT_SECRET || 'super-secret-jwt-key';
function sessionCookie(req) {
  return (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
}
async function createSession(res, user, chain) {
  const sid = randomUUID();
  await pubClient.setEx(`session:${sid}`, 43200, String(user.id));
  const token = jwt.sign({ id: user.id, public_address: user.public_address, chain, sid }, secret(), { expiresIn: '12h', issuer: 'livecrypto', audience: 'creator' });
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: 43200000 });
  res.set('Cache-Control', 'no-store');
  return res.json({ user, ...(process.env.NODE_ENV === 'test' ? { token } : {}) });
}
function readSession(req) {
  const token = sessionCookie(req) || (process.env.NODE_ENV === 'test' ? req.headers.authorization?.replace(/^Bearer /,'') : null);
  if (!token) throw new jwt.JsonWebTokenError('Missing session');
  const user = jwt.verify(token, secret(), { issuer: 'livecrypto', audience: 'creator', algorithms: ['HS256'] });
  if (!user.sid || typeof user.sid !== 'string' || !Number.isSafeInteger(user.id)) throw new jwt.JsonWebTokenError('Invalid session');
  return user;
}
async function authenticate(req) {
  const user = readSession(req);
  if (await pubClient.get(`session:${user.sid}`) !== String(user.id)) throw new jwt.JsonWebTokenError('Revoked session');
  return user;
}
async function revokeSession(req,res) {
  let user;
  try { user = readSession(req); } catch (error) { if (!(error instanceof jwt.JsonWebTokenError)) throw error; }
  // A valid token must be revoked server-side before reporting success. Preserve
  // the cookie on an outage so the user can retry instead of silently losing it.
  if (user) {
    try { await pubClient.del(`session:${user.sid}`); }
    catch { return res.status(503).json({ error:'Session store unavailable. Retry logout.' }); }
  }
  res.set('Cache-Control','no-store');
  res.clearCookie(cookieName, cookieOptions); res.json({ success: true });
}
module.exports = { authenticate, createSession, revokeSession, sessionCookie, isSessionError:error => error instanceof jwt.JsonWebTokenError };
