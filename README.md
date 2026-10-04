# CHINA2THAI — Call-first Landing Page (1688 Cost Check)

หน้าเว็บสำหรับพ่อค้าแม่ค้าออนไลน์ที่มีลิงก์ 1688 แล้ว แต่ยังไม่มั่นใจต้นทุนต่อชิ้น
เป้าหมายเดียว: เปลี่ยนคนเข้าเว็บให้ **โทร** หรือ **ทัก LINE OA** เร็วที่สุด ฟอร์มฝากเบอร์เป็นช่องทางสำรอง

```
Content → เว็บไซต์ → โทร / LINE OA → Cost Check → ใบเสนอราคา → ส่งครั้งแรก → ส่งซ้ำ
```

## เปิดใช้งานจริง (แก้ไฟล์เดียว)

แก้ `config/contact.ts` แล้ว build/deploy ใหม่

| ค่า | ตัวอย่างรูปแบบ | ใช้ที่ไหน |
| --- | --- | --- |
| `PHONE_NUMBER` | `08XXXXXXXX` / `+668XXXXXXXX` | ลิงก์ `tel:` ทุกปุ่มโทร + JSON-LD |
| `PHONE_DISPLAY` | `08X-XXX-XXXX` | เบอร์ที่โชว์บนปุ่ม/ฟุตเตอร์ (ว่างได้ ระบบจัดรูปแบบให้) |
| `LINE_OA_URL` | `https://lin.ee/XXXXXXX` | ทุกปุ่ม LINE (เปิดแท็บ/แอปใหม่) |
| `LINE_OA_ID` | `@xxxxxxx` | ฟุตเตอร์ |
| `BUSINESS_HOURS` | `จันทร์–เสาร์ 09:00–18:00` | ใต้ปุ่ม hero, ฟุตเตอร์, หน้าส่งฟอร์มสำเร็จ |
| `LINE_KEYWORD` | `คำนวณ` | ต้องตรงกับ Keyword auto-reply ใน LINE OA Manager |

ระหว่างที่ยังเป็น placeholder (`__...__`) ปุ่มโทร/LINE จะเปิดฟอร์มฝากเบอร์แทน และมีแถบเตือนบนหัวเว็บบอกว่าขาดค่าไหน — ใส่ครบแล้วแถบหายเอง

## Lead (D1 · `POST /api/leads`)

ฟอร์มเก็บ: ชื่อ*, เบอร์โทร*, LINE ID, ลิงก์ 1688, จำนวน, แบบ/สี/รุ่น, consent* (`*` = บังคับ) — ราคาที่ตั้งใจขายและจังหวัดปลายทางทีมถามเพิ่มตอนโทร (API ยังรับได้ถ้าส่งมา)

- กติกาตรวจข้อมูลชุดเดียวใช้ทั้งหน้าเว็บและ API: `lib/lead.ts`
- วางข้อความแชร์จากแอป 1688 ได้ทั้งก้อน ระบบดึง URL ให้ (รับเฉพาะโดเมน `*.1688.com`)
- กรอกครบ 3 ข้อ (ลิงก์ + จำนวน + แบบ/สี/รุ่น) → `lead_type = cost_check`, ไม่ครบ → `callback`; เก็บ `fields_completed` (0–3)
- Tag เริ่มต้น `["1688-cost-check"]`, สถานะเริ่มต้น `new`
- กันซ้ำ: ปุ่มล็อกระหว่างส่ง + `submissionId` เป็น primary key (`ON CONFLICT DO NOTHING`)
- Honeypot `website` → ตอบสำเร็จแบบเงียบ ไม่บันทึก
- เก็บ UTM / fbclid / gclid / ttclid / referrer เพื่อคำนวณ CPL ราย campaign
- Response: `201` บันทึกใหม่, `200` ซ้ำ, `422` + `fieldErrors`, `400/413/415` payload ผิด, `503` DB ขัดข้อง, `GET → 405`

Schema: `db/schema.ts` · Migration: `drizzle/0001_cost_check_lead_fields.sql`, `drizzle/0002_product_snapshot.sql` (เพิ่มคอลัมน์แบบ nullable — ข้อมูลเดิมไม่กระทบ)

## ดึงข้อมูลสินค้า 1688 อัตโนมัติ (Oxylabs)

ลูกค้าวางลิงก์ 1688 ในฟอร์ม → `POST /api/product-preview` → Oxylabs Web Scraper API ดึงหน้าสินค้า → `lib/offer-1688.ts` แกะข้อมูล → แสดงการ์ดในฟอร์ม และเก็บลง `leads.product_snapshot` ตอนส่งฟอร์ม

- ได้: ชื่อสินค้า, ร้าน, เมืองต้นทาง, ราคา ¥ (ช่วงราคา/ขั้นราคาตามจำนวน), MOQ, ทุกแบบ/สี/รุ่น พร้อมราคา สต็อก น้ำหนัก ขนาดกล่อง
- น้ำหนัก/ขนาดเป็นค่าที่ร้านกรอกเอง → ใช้เป็นตัวเลขตั้งต้น ทีมตรวจซ้ำก่อนเสนอราคา
- แปลชื่อสินค้า/ชื่อรุ่น/เมืองต้นทางเป็นไทยอัตโนมัติ (`lib/translate-zh.ts`): ชื่อรุ่นใช้พจนานุกรมศัพท์ 1688 ก่อน (แม่นเรื่องศัพท์เทคนิค) ส่วนที่เหลือและชื่อสินค้าแปลด้วยเครื่อง: มี secret `GOOGLE_TRANSLATE_API_KEY` = Google Translation, ไม่มี = MyMemory (ฟรี ~5,000 ตัวอักษร/วัน หรือ 50,000/วัน ถ้าตั้ง secret `MYMEMORY_EMAIL`), API ล่ม = พจนานุกรม · เก็บชื่อจีนต้นฉบับคู่ไว้เสมอ
- Cache 6 ชั่วโมงต่อสินค้า (ลิงก์เดิมไม่เสียโควตาซ้ำ) · รับเฉพาะคำขอจากหน้าเว็บตัวเอง · ใช้เวลา 5–30 วินาทีต่อลิงก์ใหม่
- ไม่ตั้งค่า secret = ฟอร์มทำงานตามปกติ แค่ไม่มีการ์ดสินค้า

**Secrets (ห้าม commit):** `OXYLABS_USERNAME`, `OXYLABS_PASSWORD`
- Local: คัดลอก `.dev.vars.example` เป็น `.dev.vars` แล้วใส่ค่า (ถ้ารันจาก `dist/` ให้คัดลอกไป `dist/server/.dev.vars` ด้วย)
- Production: ตั้งเป็น Site secret ผ่าน Sites (Codex) ก่อน deploy

## Tracking

ทุก event ผ่าน `lib/analytics.ts` → push เข้า `window.dataLayer` เสมอ (ไม่ติดตั้ง GTM เว็บก็ไม่ error) และไม่มีข้อมูลส่วนตัวใน event

| Event | เกิดเมื่อ | Params |
| --- | --- | --- |
| `click_call` | กดปุ่มโทร | `placement`, `contact_ready` |
| `click_line` | กดปุ่ม LINE | `placement`, `contact_ready` |
| `open_callback_form` | เปิดฟอร์มฝากเบอร์ | `placement`, `reason` |
| `submit_callback` | ส่งฟอร์มสำเร็จ ข้อมูลสินค้าไม่ครบ 3 | `lead_type`, `fields_completed` |
| `submit_cost_check` | ส่งฟอร์มสำเร็จ ครบ 3 ข้อ | `lead_type`, `fields_completed` |

ตั้งค่าใน `config/site.ts`: ใส่ `GTM_ID` เมื่อมีบัญชีจริง (ว่าง = ไม่โหลด), เปิด `FORWARD_TO_META_PIXEL` / `FORWARD_TO_GTAG` เฉพาะกรณีติดสคริปต์ตรงไม่ผ่าน GTM
Debug: เปิดเว็บด้วย `?debug_tracking=1` แล้วดู console

## KPI จาก D1 (รันใน D1 console)

```sql
-- สัดส่วน Lead ที่ส่งข้อมูลครบ (เป้า ≥ 35%) รายสัปดาห์
SELECT strftime('%Y-W%W', created_at) AS week,
       COUNT(*) AS leads,
       ROUND(100.0 * SUM(lead_type = 'cost_check') / COUNT(*), 1) AS complete_pct
FROM leads WHERE tags LIKE '%1688-cost-check%'
GROUP BY week ORDER BY week DESC;

-- Lead ราย campaign (เอาไปหาร Spend = CPL, เป้า ≤ 250 บาท)
SELECT COALESCE(utm_campaign, '(direct)') AS campaign, COUNT(*) AS leads,
       SUM(lead_type = 'cost_check') AS complete
FROM leads WHERE created_at >= date('now', '-7 days')
GROUP BY campaign ORDER BY leads DESC;
```

Lead จากโทร/LINE ไม่ผ่าน D1 — วัดด้วย `click_call` / `click_line` + จำนวนแชทที่พิมพ์ "คำนวณ" ใน LINE OA

## Development

Node.js 22.13+

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run build
npm test             # build + unit test + smoke test (เปิด wrangler local ให้เอง)
npm run test:unit    # เฉพาะ validation
```

ฐานข้อมูล local (หลัง `npm run build`): รัน migration ที่ยังไม่เคยรันกับ D1 local ตามลำดับไฟล์ใน `drizzle/`
(production ไม่ต้องทำเอง — Sites รัน migration ให้ก่อน deploy)

```bash
npx wrangler d1 execute DB --local --config dist/server/wrangler.json \
  --persist-to .wrangler/state --file drizzle/0001_cost_check_lead_fields.sql
```

## กติกาข้อความ (ห้ามใช้)

ถูกที่สุด · เร็วที่สุด · รับประกันระยะเวลาขนส่ง · ราคาคงที่ · ผ่านศุลกากรแน่นอน · สินค้าทุกชนิดนำเข้าได้
(`tests/rendered-html.test.mjs` ตรวจให้ทุกครั้งที่รัน `npm test`)

## Tech Stack

React 19 · vinext + Vite · Tailwind CSS 4 · Cloudflare Workers + D1 · Drizzle ORM · Sites hosting (`.openai/hosting.json`)
