// force redeploy 2
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// 必须加在所有路由和中间件的最前面，告诉 Express 信任 Railway 的代理
app.set('trust proxy', 1);

// ── CORS ─────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://mc-pack.vercel.app',
    'https://514admin.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ],
  credentials: true,
}));

// ── Body Parser ─────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));


// ── Routes ───────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inquiries',require('./routes/inquiries'));
app.use('/api/contents', require('./routes/contents'));
app.use('/api/settings', require('./routes/settings'));

// ── Health Check ────────────────────
app.get('/', (_, res) => res.send('Backend is running'));
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// ── 404 ─────────────────────────────
app.use((_, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error Handler ───────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── Start ───────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ MICAI backend running on port ${PORT}`);
});
