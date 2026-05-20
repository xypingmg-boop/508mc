// src/prisma/seed.js
require('dotenv').config();
const prisma = require('./client');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱  Seeding database...');

  // ── 默认管理员账号 ────────────────────────────
  const hash = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@micai-packaging.com' },
    update: {},
    create: {
      email: 'admin@micai-packaging.com',
      passwordHash: hash,
      name: '管理员',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅  Admin user created: admin@micai-packaging.com / Admin@123456');

  // ── 默认产品 ──────────────────────────────────
  const products = [
    {
      slug: 'rigid-lid-base-box',
      icon: '🎁',
      sort: 1,
      translations: [
        { lang: 'zh', name: '天地盖礼盒',         description: '经典两片式结构，适用于高档礼品、茶叶、服饰等，稳固耐用，展示效果极佳。' },
        { lang: 'en', name: 'Rigid Lid & Base Box', description: 'Classic two-piece construction ideal for premium gifts, apparel and tea.' },
        { lang: 'de', name: 'Starre Deckel-Boden-Box', description: 'Klassische zweiteilige Konstruktion, ideal für hochwertige Geschenke und Kleidung.' },
      ],
    },
    {
      slug: 'magnetic-closure-box',
      icon: '🧲',
      sort: 2,
      translations: [
        { lang: 'zh', name: '磁吸翻盖礼盒',        description: '内嵌磁铁设计，开合顺滑，常用于高端护肤品、电子产品、珠宝配饰包装。' },
        { lang: 'en', name: 'Magnetic Closure Box', description: 'Embedded magnets for a smooth open. Perfect for luxury skincare and jewellery.' },
        { lang: 'de', name: 'Box mit Magnetverschluss', description: 'Eingebettete Magnete für ein sanftes Öffnen. Ideal für Luxus-Kosmetik und Schmuck.' },
      ],
    },
    {
      slug: 'drawer-slide-box',
      icon: '📦',
      sort: 3,
      translations: [
        { lang: 'zh', name: '抽屉式礼盒',      description: '抽拉式开盖体验，仪式感强，广泛应用于巧克力、配饰、酒品等精品礼赠场景。' },
        { lang: 'en', name: 'Drawer Slide Box', description: 'Tactile slide-out reveal with strong unboxing ritual for chocolates and spirits.' },
        { lang: 'de', name: 'Schubladen-Geschenkbox', description: 'Ausziehbares Öffnungserlebnis für Schokolade und edle Spirituosen.' },
      ],
    },
    {
      slug: 'custom-shape-box',
      icon: '🌸',
      sort: 4,
      translations: [
        { lang: 'zh', name: '异形创意礼盒',    description: '打破常规方形结构，六角形、心形、提篮形等多种异形定制，彰显品牌个性。' },
        { lang: 'en', name: 'Custom Shape Box', description: 'Hexagonal, heart-shaped or handle-basket structures that make your brand unforgettable.' },
        { lang: 'de', name: 'Sonderform-Box',   description: 'Sechseckig, herzförmig oder als Körbchen — unvergesslich für Ihre Marke.' },
      ],
    },
    {
      slug: 'tea-food-gift-box',
      icon: '🍵',
      sort: 5,
      translations: [
        { lang: 'zh', name: '茶叶/食品礼盒',        description: '符合食品级环保标准，防潮防变形，精致呈现茶叶、滋补品等高端食品品牌形象。' },
        { lang: 'en', name: 'Tea & Food Gift Box',   description: 'Food-grade, moisture-resistant materials for premium tea and gourmet products.' },
        { lang: 'de', name: 'Tee- & Lebensmittel-Geschenkbox', description: 'Lebensmittelgerechte, feuchtigkeitsbeständige Materialien für Tee und Gourmetprodukte.' },
      ],
    },
    {
      slug: 'seasonal-gift-box',
      icon: '🎨',
      sort: 6,
      translations: [
        { lang: 'zh', name: '节日主题礼盒',     description: '春节、中秋、圣诞等节日专属礼盒设计，节日氛围感十足，助力品牌季节营销。' },
        { lang: 'en', name: 'Seasonal Gift Box', description: 'Chinese New Year, Mid-Autumn and Christmas designs for campaign sales.' },
        { lang: 'de', name: 'Saisonale Geschenkbox', description: 'Chinesisches Neujahr, Weihnachten und mehr für saisonale Kampagnen.' },
      ],
    },
  ];

  for (const p of products) {
    const { translations, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: data,
    });
    for (const t of translations) {
      await prisma.productTranslation.upsert({
        where: { productId_lang: { productId: product.id, lang: t.lang } },
        update: {},
        create: { ...t, productId: product.id },
      });
    }
  }
  console.log('✅  6 products seeded');

  // ── 默认设置 ──────────────────────────────────
  const settings = [
    { key: 'company_name_zh', value: '米彩包装（温州）有限公司' },
    { key: 'company_name_en', value: 'MICAI Packaging (Wenzhou) Co., Ltd.' },
    { key: 'phone',           value: '+86 0577-XXXX XXXX' },
    { key: 'email',           value: 'sales@micai-packaging.com' },
    { key: 'address_zh',      value: '温州市龙港市物流大道1588号' },
    { key: 'address_en',      value: 'No.1588 Logistics Ave, Longgang, Wenzhou, China' },
    { key: 'wechat',          value: 'micai_packaging' },
    { key: 'whatsapp',        value: '+8613X-XXXX-XXXX' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✅  Settings seeded');
  console.log('\n🎉  Database seeded successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
