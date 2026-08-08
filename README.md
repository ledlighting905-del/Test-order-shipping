# CHINA2THAI Marketplace

เว็บ Marketplace สำหรับค้นหาสินค้าจีน ขอใบเสนอราคา และเก็บ Lead ลูกค้าที่สนใจนำเข้าสินค้าจากจีนมาไทย

## Features

- หน้าร้าน Responsive สไตล์ Chinese Marketplace
- ค้นหาและกรองสินค้าตามหมวดหมู่
- Lead Funnel และแบบฟอร์มขอใบเสนอราคา
- เก็บ Lead ลง Cloudflare D1
- ป้องกัน Spam ด้วย Honeypot
- SEO และ Social Preview สำหรับแชร์ผ่าน LINE/Facebook

## Tech Stack

- React 19 + TypeScript
- vinext + Vite
- Tailwind CSS 4
- Cloudflare Workers + D1
- Drizzle ORM

## Development

ต้องใช้ Node.js 22.13 ขึ้นไป

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`

## Build

```bash
npm run build
```

## Lead Database

Schema อยู่ที่ `db/schema.ts` และ Migration อยู่ใน `drizzle/`

ฟอร์มหน้าเว็บไซต์ส่งข้อมูลไปที่ `POST /api/leads`
