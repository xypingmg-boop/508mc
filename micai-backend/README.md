# 米彩包装后端 API

> Node.js + Express + Prisma + PostgreSQL

---

## 项目结构

```
micai-backend/
├── prisma/
│   └── schema.prisma        # 数据库模型定义
├── src/
│   ├── index.js             # 入口文件
│   ├── prisma/
│   │   ├── client.js        # Prisma 单例
│   │   └── seed.js          # 初始化数据（管理员 + 产品）
│   ├── middleware/
│   │   ├── auth.js          # JWT 鉴权中间件
│   │   └── mailer.js        # 邮件服务
│   └── routes/
│       ├── inquiries.js     # 询盘表单
│       ├── products.js      # 产品管理（增删改查）
│       ├── contents.js      # CMS 内容管理
│       ├── auth.js          # 登录 / 用户管理
│       └── settings.js      # 网站设置
├── .env.example             # 环境变量模板
├── railway.toml             # Railway 部署配置
└── package.json
```

---

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env，填写数据库连接串、邮件配置等
```

### 3. 初始化数据库
```bash
# 生成 Prisma Client
npm run db:generate

# 执行迁移（创建表结构）
npx prisma migrate dev --name init

# 写入初始数据（管理员账号 + 6个默认产品）
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
# 服务运行在 http://localhost:4000
```

### 5. 可视化管理数据库（可选）
```bash
npm run db:studio
# 打开 http://localhost:5555
```

---

## 部署到 Railway

### 第一步：创建项目
1. 访问 [railway.app](https://railway.app) 并注册
2. New Project → Deploy from GitHub repo（上传此目录）
3. Add Plugin → PostgreSQL（Railway 会自动注入 DATABASE_URL）

### 第二步：配置环境变量
在 Railway 项目 Settings → Variables 添加：

| 变量名 | 说明 |
|--------|------|
| `JWT_SECRET` | 随机字符串，建议32位以上 |
| `MAIL_USER` | Gmail 地址 |
| `MAIL_PASS` | Gmail 应用专用密码（16位） |
| `MAIL_TO_SALES` | 询盘接收邮箱 |
| `FRONTEND_URL` | 前端 Vercel 域名，如 `https://micai.vercel.app` |

> `DATABASE_URL` 由 Railway PostgreSQL 插件自动注入，无需手动填写。

### 第三步：部署
推送代码后 Railway 自动构建并部署。`railway.toml` 中已配置：
- 自动执行 `prisma migrate` 建表
- 健康检查路径 `/health`

### 第四步：首次初始化数据
部署成功后，在 Railway 控制台执行：
```bash
node src/prisma/seed.js
```
默认管理员账号：
- 邮箱：`admin@micai-packaging.com`
- 密码：`Admin@123456`（**请立即修改**）

---

## API 文档

### 公开接口（无需 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/inquiries` | 提交询盘表单 |
| `GET` | `/api/products?lang=zh` | 获取产品列表 |
| `GET` | `/api/products/:slug?lang=zh` | 获取单个产品 |
| `GET` | `/api/contents?lang=zh` | 获取CMS内容 |
| `GET` | `/api/settings` | 获取网站设置 |
| `POST` | `/api/auth/login` | 管理员登录 |
| `GET` | `/health` | 健康检查 |

### 管理接口（需 Bearer Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/inquiries` | 获取询盘列表 |
| `PATCH` | `/api/inquiries/:id` | 更新询盘状态 |
| `DELETE` | `/api/inquiries/:id` | 删除询盘 |
| `POST` | `/api/products` | 新建产品 |
| `PUT` | `/api/products/:id` | 更新产品 |
| `DELETE` | `/api/products/:id` | 删除产品 |
| `PUT` | `/api/contents` | 批量更新CMS内容 |
| `PUT` | `/api/settings` | 批量更新设置 |
| `GET` | `/api/auth/me` | 获取当前用户 |
| `POST` | `/api/auth/change-password` | 修改密码 |
| `GET` | `/api/auth/users` | 用户列表（超级管理员）|
| `POST` | `/api/auth/users` | 新建用户（超级管理员）|

---

## 前端接入示例

在网站 HTML 中，将表单提交改为调用后端 API：

```javascript
// 替换原来的 handleSubmit 函数
async function handleSubmit(btn) {
  const lang = document.body.classList.contains('lang-de') ? 'de'
             : document.body.classList.contains('lang-en') ? 'en' : 'zh';

  const payload = {
    name:        document.querySelector('input[type="text"]').value,
    phone:       document.querySelector('input[type="tel"]').value,
    email:       document.querySelector('input[type="email"]').value,
    productType: document.querySelector('select').value,
    message:     document.querySelector('textarea').value,
    lang,
  };

  try {
    btn.disabled = true;
    const res = await fetch('https://YOUR_RAILWAY_DOMAIN/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error();

    const msgs = {
      zh: '✓ 询盘已发送，我们将在24小时内联系您',
      en: '✓ Enquiry sent — we\'ll be in touch within 24 hours',
      de: '✓ Anfrage gesendet — wir melden uns innerhalb von 24 Stunden',
    };
    btn.innerHTML = msgs[lang];
    btn.style.background = '#4A7C59';
    btn.style.color = '#FAF6F0';
  } catch {
    btn.disabled = false;
    btn.innerHTML = '发送失败，请重试 / Failed, please retry';
  }
}
```
