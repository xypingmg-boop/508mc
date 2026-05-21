// src/index.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();


// ── CORS ─────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ],
  credentials: true,
}));


// ── Body Parser ─────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));


// ── Rate Limit ──────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests'
  }
}));


// ── 登录接口 ─────────────────────────
app.post('/api/auth/login', (req, res) => {

  const { email, password } = req.body;

  console.log('登录请求:', email);

  if (
    email === 'admin@micai.com' &&
    password === '123456'
  ) {

    return res.json({
      token: 'demo-token',
      user: {
        id: '1',
        email,
        name: 'Admin',
        role: 'admin'
      }
    });

  }

  return res.status(401).json({
    error: '账号或密码错误'
  });

});


// ── 产品接口 ─────────────────────────
app.get('/api/products', (req, res) => {

  res.json([
    {
      id: 1,
      name: '磁吸翻盖礼盒',
      category: 'Gift Box',
      price: '$2.50'
    },
    {
      id: 2,
      name: '天地盖礼盒',
      category: 'Packaging',
      price: '$1.80'
    }
  ]);

});


// ── 询盘接口 ─────────────────────────
app.get('/api/inquiries', (req, res) => {

  res.json([
    {
      id: 1,
      company: 'ABC Company',
      name: 'John',
      email: 'john@example.com',
      quantity: '5000',
      message: 'Need luxury gift boxes'
    }
  ]);

});


// ── Health Check ────────────────────
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    ts: new Date()
  });
});


// ── 404 ─────────────────────────────
app.use((_, res) => {
  res.status(404).json({
    error: 'Not found'
  });
});


// ── Error Handler ───────────────────
app.use((err, _req, res, _next) => {

  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });

});


// ── Start ───────────────────────────
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ MICAI backend running on port ${PORT}`);
});
