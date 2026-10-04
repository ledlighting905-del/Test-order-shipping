/** ข้อมูลเว็บไซต์และการวัดผล — แก้ที่นี่ที่เดียว */

export const SITE_URL = "https://china2thai-market-68.ledlighting905.chatgpt.site";
export const SITE_NAME = "CHINA2THAI";

export const SEO = {
  title: "รู้ต้นทุนก่อนกดสั่ง 1688 | CHINA2THAI",
  description:
    "มีลิงก์สินค้า 1688 แล้ว แต่ยังไม่ชัวร์ต้นทุนต่อชิ้นและกำไร? โทรหรือทัก LINE ส่งลิงก์ จำนวน แบบ/สี/รุ่น ราคาที่ตั้งใจขาย และจังหวัดปลายทาง ให้ทีมช่วยเช็กต้นทุนก่อนสั่ง",
  ogDescription: "ส่งลิงก์ 1688 กับจำนวนมาให้ทีมเช็กต้นทุนต่อชิ้นก่อนตัดสินใจสั่ง โทรหรือทัก LINE ได้ทันที",
} as const;

/**
 * Tracking — ห้ามใส่ ID ปลอม ปล่อยว่างไว้จนกว่าจะมีบัญชีจริง
 *
 * ทุก event ถูก push เข้า window.dataLayer เสมอ (ปลอดภัยแม้ยังไม่ติดตั้งอะไร)
 * ใส่ GTM_ID เมื่อพร้อม แล้วตั้ง Trigger ใน GTM จาก Custom Event:
 * click_call, click_line, open_callback_form, submit_callback, submit_cost_check
 */
export const TRACKING = {
  /** Google Tag Manager Container ID เช่น GTM-XXXXXXX — ว่าง = ไม่โหลด GTM */
  GTM_ID: "",
  /** ส่ง event ตรงเข้า gtag() ด้วย (เปิดเฉพาะกรณีติด GA4 แบบ gtag.js โดยไม่ผ่าน GTM) */
  FORWARD_TO_GTAG: false,
  /** ส่ง event ตรงเข้า Meta Pixel fbq() ด้วย (เปิดเฉพาะกรณีติด Pixel ตรง ไม่ผ่าน GTM) */
  FORWARD_TO_META_PIXEL: false,
} as const;
