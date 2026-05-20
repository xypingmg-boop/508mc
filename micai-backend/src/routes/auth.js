// src/routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const prisma  = require('../prisma/client');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '登录尝试过多，请15分钟后再试' },
});

// ── POST /api/auth/login ──────────────────────────
router.post('/login',
  loginLimit,
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: '账号不存在或已禁用' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: '密码错误' });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }
);

// ── GET /api/auth/me ──────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
  });
  res.json(user);
});

// ── POST /api/auth/change-password ────────────────
router.post('/change-password',
  requireAuth,
  [
    body('oldPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: '原密码错误' });

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hash } });

    res.json({ success: true });
  }
);

// ── GET /api/auth/users  (super admin only) ───────
router.get('/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// ── POST /api/auth/users  (super admin only) ──────
router.post('/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const { email, password, name, role } = req.body;
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, passwordHash: hash, name, role: role || 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  });
  res.status(201).json(user);
});

// ── PATCH /api/auth/users/:id  (super admin) ──────
router.patch('/users/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, role, active } = req.body;
  const user = await prisma.user.update({
    where:  { id: req.params.id },
    data:   { name, role, active },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  res.json(user);
});

module.exports = router;
