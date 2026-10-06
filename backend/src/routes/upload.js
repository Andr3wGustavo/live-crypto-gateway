const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const FormData = require('form-data');
const { saveAlertSettings, notifyAlertSettings } = require('../services/alertSettings');
const { mediaFormat } = require('../services/mediaFormat');

const router = express.Router();
router.use(require('../middleware/auth'));
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:5*1024*1024,files:1,fields:1,parts:2,fieldSize:128 } });
const limiter = rateLimit({ windowMs:60*60*1000,limit:20,keyGenerator:req=>String(req.user.id),standardHeaders:true,legacyHeaders:false });

router.post('/upload', limiter, (req,res,next) => {
  if (!process.env.PINATA_JWT) return res.status(503).json({ error:'Media storage is not configured' });
  next();
}, upload.single('file'), async (req,res,next) => {
  if (!req.file) return res.status(400).json({ error:'No file provided' });
  const kind = req.body.type;
  if (!['media','audio'].includes(kind)) return res.status(400).json({ error:'Invalid upload type' });
  const format = mediaFormat(req.file.buffer,kind);
  if (!format) return res.status(415).json({ error:'Unsupported media content for this upload type' });
  const form = new FormData();
  form.append('file',req.file.buffer,{ filename:`alert.${format.extension}`,contentType:format.mime });
  form.append('pinataMetadata',JSON.stringify({name:`Streamer_${req.user.id}_${kind}`}));
  let cid;
  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS',form,{
      timeout:15000,maxRedirects:0,maxBodyLength:6*1024*1024,maxContentLength:65536,
      headers:{...form.getHeaders(),Authorization:`Bearer ${process.env.PINATA_JWT}`}
    });
    cid = response.data?.IpfsHash;
    if (typeof cid !== 'string' || !/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,120})$/.test(cid)) throw new Error('Invalid provider response');
  } catch {
    // Do not log Axios objects, response bodies, credentials or provider URLs.
    return res.status(502).json({ error:'Media provider unavailable or returned an invalid response' });
  }
  try {
    // A safe filename hint also lets the overlay recognize a video CID URL.
    const url = `https://gateway.pinata.cloud/ipfs/${cid}?filename=alert.${format.extension}`;
    const config = await saveAlertSettings(req.user.id,{ [kind === 'media' ? 'media_url' : 'audio_url']:url });
    const realtime = await notifyAlertSettings(req.user.id,config);
    res.json({ success:true,url,hash:cid,realtime });
  } catch (error) { next(error); }
});
module.exports = router;
