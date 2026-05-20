// src/routes/contents.js
const express = require('express');
const prisma  = require('../prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/contents?lang=zh  (public) ──────────
// Returns all content keys for the given language as a flat key→value map
router.get('/', async (req, res) => {
  const lang = req.query.lang || 'zh';
  const rows = await prisma.content.findMany({ where: { lang } });
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(map);
});

// ── GET /api/contents/:key?lang=zh  (public) ──────
router.get('/:key', async (req, res) => {
  const lang = req.query.lang || 'zh';
  const row  = await prisma.content.findUnique({
    where: { key_lang: { key: req.params.key, lang } },
  });
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// ── PUT /api/contents  (admin — bulk upsert) ──────
// Body: [{ key, lang, value }, ...]
router.put('/', requireAuth, async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(422).json({ error: 'Expected array' });

  const ops = items.map(({ key, lang, value }) =>
    prisma.content.upsert({
      where:  { key_lang: { key, lang } },
      update: { value },
      create: { key, lang, value },
    })
  );

  const results = await Promise.all(ops);
  res.json(results);
});

// ── DELETE /api/contents/:key  (admin) ───────────
router.delete('/:key', requireAuth, async (req, res) => {
  const { lang } = req.query;
  if (lang) {
    await prisma.content.deleteMany({ where: { key: req.params.key, lang } });
  } else {
    await prisma.content.deleteMany({ where: { key: req.params.key } });
  }
  res.json({ success: true });
});

module.exports = router;
