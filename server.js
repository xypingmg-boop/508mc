const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

// 📩 邮件接口
app.post('/api/contact', async (req, res) => {

  try {

    const { company, name, email, phone, quantity, message } = req.body;

    console.log('收到询盘：', req.body);

    // ====== 邮件配置（Gmail / 126 / 163 都可以）======
    const transporter = nodemailer.createTransport({
      host: 'smtp.126.com',   // 👉 如果你用 Gmail 改成 smtp.gmail.com
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // ====== 邮件内容 ======
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: 'New Inquiry from Website',
      text: `
New Inquiry:

Company: ${company}
Name: ${name}
Email: ${email}
Phone: ${phone}
Quantity: ${quantity}

Message:
${message}
      `
    };

    // ====== 发送邮件 ======
    //await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Email sent'
    });

  } catch (error) {

    console.error(error);

    res.json({
      success: false,
      message: 'Email failed'
    });

  }

});

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
