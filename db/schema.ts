import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  lineId: text("line_id"),
  /** สรุปข้อความอ่านง่าย (คอลัมน์เดิม — ยังใช้ต่อเพื่อความเข้ากันได้) */
  interest: text("interest").notNull(),
  /** ตำแหน่งปุ่มที่เปิดฟอร์ม เช่น hero, footer, call-pending */
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull(),

  // Cost Check — ข้อมูลสินค้าแบบมีโครงสร้าง
  productUrl: text("product_url"),
  quantity: integer("quantity"),
  variant: text("variant"),
  targetPrice: real("target_price"),
  province: text("province"),
  /** cost_check = ส่งครบ 5 ข้อ, callback = ขอให้โทรกลับ */
  leadType: text("lead_type"),
  fieldsCompleted: integer("fields_completed"),
  /** JSON array เช่น ["1688-cost-check"] */
  tags: text("tags"),
  consentAt: text("consent_at"),

  // Attribution — ใช้คำนวณ CPL ราย campaign
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  clickId: text("click_id"),
  referrer: text("referrer"),
  landingPath: text("landing_path"),
});
