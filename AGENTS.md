# AGENTS.md — CHINA2THAI landing page

- เป้าหมายหน้าเว็บ: Call-first — ปุ่มโทรและ LINE ต้องเด่นที่สุด ฟอร์มฝากเบอร์เป็นทางสำรองเสมอ
- ข้อมูลติดต่อแก้ที่ `config/contact.ts` ที่เดียว ห้าม hard-code เบอร์/ลิงก์ LINE ในคอมโพเนนต์ ห้ามสร้างข้อมูลติดต่อขึ้นเอง
- Tracking ID แก้ที่ `config/site.ts` ห้ามใส่ ID ปลอม; ส่ง event ผ่าน `lib/analytics.ts` เท่านั้น และห้ามส่งข้อมูลส่วนตัวเข้า event
- กติกา validation ของ Lead อยู่ที่ `lib/lead.ts` (ใช้ทั้งฝั่งเว็บและ API) — แก้ที่เดียว
- Schema D1 เปลี่ยนผ่าน `npm run db:generate` เท่านั้น ห้ามแก้ migration ที่ deploy แล้ว ห้าม CREATE/ALTER ตอน runtime
- ห้ามใช้ข้อความ: ถูกที่สุด, เร็วที่สุด, รับประกันระยะเวลาขนส่ง, ราคาคงที่, ผ่านศุลกากรแน่นอน, สินค้าทุกชนิดนำเข้าได้
- โทนสี ส้ม–ครีม–น้ำตาลเข้ม (tokens ใน `app/globals.css`), headline "รู้ต้นทุนก่อนกดสั่ง 1688", มือถือมี sticky contact bar
- ก่อนจบงาน: `npm run lint` และ `npm test` ต้องผ่าน
- Hosting: Sites (`.openai/hosting.json`) ใช้ `project_id` เดิมเท่านั้น ห้ามสร้าง Site ใหม่
- ข้อมูลสินค้า 1688: ดึงผ่าน `lib/offer-service.ts` (Oxylabs) ฝั่ง server เท่านั้น credentials อยู่ใน secret `OXYLABS_USERNAME`/`OXYLABS_PASSWORD` ห้ามใส่ในโค้ดหรือ commit `.dev.vars`
