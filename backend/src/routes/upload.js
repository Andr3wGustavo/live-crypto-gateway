const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const db = require('../db');

const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Configure Multer for in-memory file storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const PINATA_JWT = process.env.PINATA_JWT;

/**
 * POST /api/dashboard/upload
 * Uploads media (GIF/Audio) to IPFS via Pinata and saves the URL to Alert_Configs
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const streamerId = req.user.id;
  const fileType = req.body.type; // 'media' or 'audio'

  if (!streamerId || !['media', 'audio'].includes(fileType)) {
    return res.status(400).json({ error: 'Invalid streamer_id or type' });
  }

  try {
    // 1. Prepare file for Pinata
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const metadata = JSON.stringify({
      name: `Streamer_${streamerId}_${fileType}`,
    });
    formData.append('pinataMetadata', metadata);

    // 2. Upload to Pinata (IPFS)
    const pinataRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
    });

    const ipfsHash = pinataRes.data.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    // 3. Save to database in Alert_Configs
    const column = fileType === 'media' ? 'media_url' : 'audio_url';
    
    await db.query(
      `INSERT INTO Alert_Configs (streamer_id, ${column}) 
       VALUES ($1, $2)
       ON CONFLICT (streamer_id) 
       DO UPDATE SET ${column} = EXCLUDED.${column}`,
      [streamerId, ipfsUrl]
    );

    res.json({ success: true, url: ipfsUrl, hash: ipfsHash });
  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to upload to IPFS' });
  }
});

module.exports = router;
