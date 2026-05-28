// src/middleware/mailer.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendInquiryNotification(inquiry) {
  const subject = `【新询盘】${inquiry.name} — ${inquiry.productType || '未指定产品'}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1A1208;padding:24px 32px">
        <h2 style="color:#C9A96E;margin:0;font-size:20px">米彩包装 — 新询盘通知</h2>
      </div>
      <div style="padding:32px;background:#FAF6F0">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#8A7B6A;width:120px">姓名</td><td style="padding:8px 0;font-weight:600">${inquiry.name}</td></tr>
          <tr><td style="padding:8px 0;color:#8A7B6A">公司</td><td style="padding:8px 0">${inquiry.company || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#8A7B6A">电话</td><td style="padding:8px 0">${inquiry.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#8A7B6A">邮箱</td><td style="padding:8px 0">${inquiry.email || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#8A7B6A">产品类型</td><td style="padding:8px 0">${inquiry.productType || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#8A7B6A">语言</td><td style="padding:8px 0">${inquiry.lang.toUpperCase()}</td></tr>
          <tr><td style="padding:8px 0;color:#8A7B6A;vertical-align:top">需求描述</td><td style="padding:8px 0;line-height:1.7">${inquiry.message || '—'}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #E8D5A3;font-size:12px;color:#8A7B6A">
          提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
        </div>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: process.env.MAIL_FROM,
    to:   process.env.MAIL_TO_SALES,
    subject,
    html,
  });
}

async function sendAutoReply(inquiry) {
  const subjects = {
    zh: '感谢您的询盘 — 米彩包装',
    en: 'Thank you for your enquiry — MICAI Packaging',
    de: 'Vielen Dank für Ihre Anfrage — MICAI Packaging',
  };
  const greetings = {
    zh: `尊敬的 ${inquiry.name}，\n\n感谢您联系米彩包装！我们已收到您的询盘，业务顾问将在 24 小时内与您联系。\n\n如有紧急需求，请直接联系我们：\n邮箱：sales@micai-packaging.com\n\n米彩包装团队`,
    en: `Dear ${inquiry.name},\n\nThank you for contacting MICAI Packaging! We have received your enquiry and a consultant will reach out within 24 hours.\n\nFor urgent matters: sales@micai-packaging.com\n\nBest regards,\nMICAI Packaging Team`,
    de: `Sehr geehrte/r ${inquiry.name},\n\nVielen Dank für Ihre Anfrage bei MICAI Packaging! Wir haben Ihre Anfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.\n\nBei dringenden Fragen: sales@micai-packaging.com\n\nMit freundlichen Grüßen,\nMICAI Packaging Team`,
  };
  const lang = inquiry.lang in subjects ? inquiry.lang : 'zh';
  if (!inquiry.email) return;
  await resend.emails.send({
    from:    process.env.MAIL_FROM,
    to:      inquiry.email,
    subject: subjects[lang],
    text:    greetings[lang],
  });
}

module.exports = { sendInquiryNotification, sendAutoReply };
