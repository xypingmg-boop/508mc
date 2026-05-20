// src/routes/settings.js
const express = require('express');
const prisma  = require('../prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/settings  (public) ──────────────────
router.get('/', async (req, res) => {
  const rows = await prisma.setting.findMany();
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(map);
});

// ── PUT /api/settings  (admin — bulk upsert) ──────
// Body: { key: value, ... }
router.put('/', requireAuth, async (req, res) => {
  const entries = Object.entries(req.body);
  const ops = entries.map(([key, value]) =>
    prisma.setting.upsert({
      where:  { key },
      update: { value: String(value) },
      create: { key,  value: String(value) },
    })
  );
  const results = await Promise.all(ops);
  res.json(results);
});

// ── DELETE /api/settings/:key  (admin) ───────────
router.delete('/:key', requireAuth, async (req, res) => {
  await prisma.setting.delete({ where: { key: req.params.key } });
  res.json({ success: true });
});

module.exports = router;
