const express = require('express');
const rateLimit = require('express-rate-limit');
const service = require('../services/paymentIntents');
const db = require('../db');
const router = express.Router();
const token = req => req.headers.authorization?.replace(/^Bearer /, '') || '';
const wrap = handler => async (req,res,next) => {
  try { await handler(req,res); }
  catch (error) { if (error.status) return res.status(error.status).json({ error: error.message }); next(error); }
};
router.use((req,res,next) => { res.set('Cache-Control','no-store'); next(); });
router.post('/intents', rateLimit({ windowMs: 15*60*1000, limit: 20, standardHeaders: true, legacyHeaders: false }), wrap(async (req,res) => {
  res.status(201).json(await service.createIntent(req.body));
}));
router.get('/intents/:id', wrap(async (req,res) => {
  const intent = await service.getIntent(req.params.id, token(req));
  const { rows } = await db.query('SELECT amount,platform_fee,gross_amount FROM Transactions WHERE intent_id=$1', [intent.id]);
  res.json({ ...service.expose(intent), transaction: rows[0] || null });
}));
router.post('/intents/:id/submit', wrap(async (req,res) => {
  res.status(202).json(await service.submitHash(req.params.id, token(req), req.body.tx_hash));
}));
module.exports = router;
