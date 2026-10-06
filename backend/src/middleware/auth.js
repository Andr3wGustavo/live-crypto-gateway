const { authenticate, isSessionError } = require('../services/sessions');
module.exports = async (req,res,next) => {
  try { req.user = await authenticate(req); res.set('Cache-Control','no-store'); next(); }
  catch (error) { res.status(isSessionError(error) ? 401 : 503).json({ error:isSessionError(error) ? 'Session expired or invalid' : 'Session store unavailable' }); }
};
