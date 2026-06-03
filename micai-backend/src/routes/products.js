// src/routes/products.js
const express = require('express');
const slugify = require('slugify');
const prisma  = require('../prisma/client');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// ── GET /api/products?lang=zh  (public) ──────────
router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { sort: 'asc' },
    include: { translations: true },
  });
  res.json(products);
});

// ── GET /api/products/:slug  (public) ─────────────
router.get('/:slug', async (req, res) => {
  const lang = req.query.lang || 'zh';
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { translations: true },
  });
  if (!product) return res.status(404).json({ error: 'Not found' });
  const t = product.translations.find(t => t.lang === lang)
         || product.translations.find(t => t.lang === 'zh')
         || {};
  res.json({ ...product, name: t.name, description: t.description });
});

// ── POST /api/products  (admin) ───────────────────
router.post('/', requireAuth, async (req, res) => {
  const { icon, imageUrl, sort, visible, translations } = req.body;
  const zhName = translations?.find(t => t.lang === 'zh')?.name || 'product';
  const slug   = slugify(zhName, { lower: true, strict: true });
  const product = await prisma.product.create({
    data: {
      slug, icon, imageUrl,
      sort:    sort    ?? 0,
      visible: visible ?? true,
      translations: {
        create: translations || [],
      },
    },
    include: { translations: true },
  });
  res.status(201).json(product);
});

// ── PUT /api/products/:id  (admin) ────────────────
router.put('/:id', requireAuth, async (req, res) => {
  const { icon, imageUrl, sort, visible, translations } = req.body;
  if (translations) {
    for (const t of translations) {
      await prisma.productTranslation.upsert({
        where:  { productId_lang: { productId: req.params.id, lang: t.lang } },
        update: { name: t.name, description: t.description },
        create: { productId: req.params.id, lang: t.lang, name: t.name, description: t.description },
      });
    }
  }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data:  { icon, imageUrl, sort, visible },
    include: { translations: true },
  });
  res.json(product);
});

// ── DELETE /api/products/:id  (admin) ─────────────
router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
