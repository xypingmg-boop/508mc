const express = require('express');
const slugify = require('slugify');
const prisma  = require('../prisma/client');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

const INCLUDE = {
  translations: true,
  variants: { where: { visible: true }, orderBy: { label: 'asc' } },
};

router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { sort: 'asc' },
    include: INCLUDE,
  });
  res.json(products);
});

router.get('/:slug', async (req, res) => {
  const lang = req.query.lang || 'zh';
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: INCLUDE,
  });
  if (!product) return res.status(404).json({ error: 'Not found' });
  const t = product.translations.find(t => t.lang === lang)
         || product.translations.find(t => t.lang === 'zh') || {};
  res.json({ ...product, name: t.name, description: t.description });
});

router.post('/', requireAuth, async (req, res) => {
  const { icon, imageUrl, images, price, originalPrice, sku, stock, sort, visible, translations, variants } = req.body;
  const zhName = translations?.find(t => t.lang === 'zh')?.name || 'product';
  const baseSlug = slugify(zhName, { lower: true, strict: true }) || Date.now().toString();
  let slug = baseSlug;
  let i = 1;
  while (await prisma.product.findUnique({ where: { slug } })) { slug = baseSlug + '-' + i++; }
  const product = await prisma.product.create({
    data: {
      slug, icon, imageUrl,
      images: images || [],
      price, originalPrice, sku,
      stock: stock ?? 0,
      sort: sort ?? 0,
      visible: visible ?? true,
      translations: {
        create: (translations || []).map(t => ({
          lang: t.lang,
          name: t.name || '',
          description: t.description || '',
          bulletPoints: t.bulletPoints || [],
          detail: t.detail || '',
        })),
      },
      variants: {
        create: (variants || []).map(v => ({
          label: v.label,
          sku: v.sku || '',
          price: v.price || '',
          stock: v.stock ?? 0,
          visible: v.visible ?? true,
        })),
      },
    },
    include: INCLUDE,
  });
  res.status(201).json(product);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { icon, imageUrl, images, price, originalPrice, sku, stock, sort, visible, translations, variants } = req.body;
  if (translations) {
    for (const t of translations) {
      await prisma.productTranslation.upsert({
        where:  { productId_lang: { productId: req.params.id, lang: t.lang } },
        update: { name: t.name || '', description: t.description || '', bulletPoints: t.bulletPoints || [], detail: t.detail || '' },
        create: { productId: req.params.id, lang: t.lang, name: t.name || '', description: t.description || '', bulletPoints: t.bulletPoints || [], detail: t.detail || '' },
      });
    }
  }
  if (variants !== undefined) {
    await prisma.productVariant.deleteMany({ where: { productId: req.params.id } });
    if (variants.length) {
      await prisma.productVariant.createMany({
        data: variants.map(v => ({
          productId: req.params.id,
          label: v.label,
          sku: v.sku || '',
          price: v.price || '',
          stock: v.stock ?? 0,
          visible: v.visible ?? true,
        })),
      });
    }
  }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data:  { icon, imageUrl, images: images || [], price, originalPrice, sku, stock: stock ?? 0, sort, visible },
    include: INCLUDE,
  });
  res.json(product);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
