// src/routes/upload.js
const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '没有收到图片' });

  // 超时控制：15秒
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: '图片上传超时，请重试' });
    }
  }, 15000);

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'micai-products', resource_type: 'auto', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'webm'] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    clearTimeout(timeout);
    if (!res.headersSent) {
      res.json({ url: result.secure_url });
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error('Cloudinary upload error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '图片上传失败，请重试' });
    }
  }
});

module.exports = router;
