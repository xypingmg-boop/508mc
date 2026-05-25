// src/routes/inquiries.js
const express  = require('express');
const { body, validationResult } = require('express-validator');
const prisma   = require('../prisma/client');
const { sendInquiryNotification, sendAutoReply } = require('../middleware/mailer');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Stricter rate limit for form submissions

// ── POST /api/inquiries  (public — website form) ──
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('姓名不能为空'),
    body('phone').trim().notEmpty().withMessage('电话不能为空'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('邮箱格式不正确'),
    body('lang').optional().isIn(['zh', 'en', 'de']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, company, phone, email, productType, message, lang } = req.body;

    try {
      const inquiry = await prisma.inquiry.create({
        data: {
          name, company, phone, email, productType, message,
          lang: lang || 'zh',
          ipAddress: req.ip,
        },
      });

      // Fire-and-forget emails
      sendInquiryNotification(inquiry).catch(console.error);
      sendAutoReply(inquiry).catch(console.error);

      return res.status(201).json({ success: true, id: inquiry.id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── GET /api/inquiries  (admin only) ──────────────
router.get('/', requireAuth, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = status ? { status } : {};
  const skip  = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.inquiry.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ── PATCH /api/inquiries/:id  (admin — update status) ──
router.patch('/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['NEW', 'CONTACTED', 'QUOTED', 'CLOSED'];
  if (!allowed.includes(status)) return res.status(422).json({ error: 'Invalid status' });

  const inquiry = await prisma.inquiry.update({
    where: { id: req.params.id },
    data:  { status },
  });
  res.json(inquiry);
});

// ── DELETE /api/inquiries/:id  (admin) ────────────
router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.inquiry.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
