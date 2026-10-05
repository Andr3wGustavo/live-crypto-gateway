const { authenticate } = require('../services/sessions');
module.exports = async (req,res,next) => {
  try { req.user = await authenticate(req); res.set('Cache-Control','no-store'); next(); }
  catch { res.status(401).json({ error:'Session expired or invalid' }); }
};
