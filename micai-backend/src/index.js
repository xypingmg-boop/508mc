// src/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ── CORS ─────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:5500',   // Live Server 本地调试
  ],
  credentials: true,
}));

// ── Body parsers ─────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Global rate limit ────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Routes ───────────────────────────────────────
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/contents',  require('./routes/contents'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/settings',  require('./routes/settings'));

// ── Health check ─────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// ── 404 & error handler ──────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅  MICAI backend running on port ${PORT}`);
});
