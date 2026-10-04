/**
 * ข้อมูลติดต่อของ CHINA2THAI — แก้ที่ไฟล์นี้ไฟล์เดียว ทั้งเว็บเปลี่ยนตาม
 *
 * วิธีเปิดใช้งานจริง
 * 1. แทนค่าที่ขึ้นต้นและลงท้ายด้วย "__" ด้วยข้อมูลจริง
 * 2. build แล้ว deploy ใหม่
 *
 * ระหว่างที่ยังเป็น placeholder:
 * - ปุ่มโทร/LINE จะเปิดฟอร์มฝากเบอร์แทน (ลูกค้าไม่เจอลิงก์เสีย)
 * - หัวเว็บจะมีแถบเตือน "ยังไม่ได้ตั้งค่า" บอกว่าขาดค่าไหน
 */

/** เบอร์ที่ใช้โทรออก — ตัวเลขล้วน เช่น 08XXXXXXXX, 02XXXXXXX หรือ +668XXXXXXXX */
export const PHONE_NUMBER = "__PHONE_NUMBER__";

/** เบอร์ที่โชว์บนเว็บ เช่น 08X-XXX-XXXX (ปล่อย placeholder ไว้ได้ ระบบจัดรูปแบบจาก PHONE_NUMBER ให้) */
export const PHONE_DISPLAY = "__PHONE_DISPLAY__";

/** ลิงก์แอดเพื่อน LINE OA จาก LINE Official Account Manager เช่น https://lin.ee/XXXXXXX */
export const LINE_OA_URL = "__LINE_OA_URL__";

/** Basic ID หรือ Premium ID ของ LINE OA (มี @ นำหน้า) เช่น @xxxxxxx */
export const LINE_OA_ID = "__LINE_OA_ID__";

/** เวลาทำการที่โชว์บนเว็บ เช่น จันทร์–เสาร์ 09:00–18:00 */
export const BUSINESS_HOURS = "__BUSINESS_HOURS__";

/** คำที่ให้ลูกค้าพิมพ์ใน LINE — ต้องตรงกับ Keyword auto-reply ใน LINE OA Manager */
export const LINE_KEYWORD = "คำนวณ";

/* ------------------------------------------------------------------ */
/* ด้านล่างนี้ระบบคำนวณให้อัตโนมัติ ไม่ต้องแก้                             */
/* ------------------------------------------------------------------ */

function isPlaceholder(value: string) {
  const trimmed = value.trim();
  return trimmed === "" || /^__.*__$/.test(trimmed);
}

function toNationalDigits(raw: string) {
  const compact = raw.replace(/[\s().-]/g, "");
  if (/^\+66\d{8,9}$/.test(compact)) return `0${compact.slice(3)}`;
  return compact;
}

function phoneHref(raw: string) {
  if (isPlaceholder(raw)) return null;
  const digits = toNationalDigits(raw);
  if (/^0\d{8,9}$/.test(digits)) return `tel:+66${digits.slice(1)}`;
  if (/^1\d{3}$/.test(digits)) return `tel:${digits}`;
  return null;
}

function formatPhone(raw: string) {
  const digits = toNationalDigits(raw);
  if (/^0[689]\d{8}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (/^02\d{7}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  if (/^0\d{8}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

const telHref = phoneHref(PHONE_NUMBER);
const lineReady = !isPlaceholder(LINE_OA_URL) && /^https:\/\/(lin\.ee|line\.me|page\.line\.me)\//.test(LINE_OA_URL.trim());
const lineIdReady = !isPlaceholder(LINE_OA_ID) && /^@[a-z0-9._-]{3,30}$/i.test(LINE_OA_ID.trim());

const missing = [
  !telHref && "PHONE_NUMBER",
  !lineReady && "LINE_OA_URL",
  !lineIdReady && "LINE_OA_ID",
  isPlaceholder(BUSINESS_HOURS) && "BUSINESS_HOURS",
].filter((key): key is string => Boolean(key));

export const contact = {
  phone: {
    ready: telHref !== null,
    href: telHref,
    display: telHref ? (isPlaceholder(PHONE_DISPLAY) ? formatPhone(PHONE_NUMBER) : PHONE_DISPLAY.trim()) : null,
  },
  line: {
    ready: lineReady,
    href: lineReady ? LINE_OA_URL.trim() : null,
    id: lineIdReady ? LINE_OA_ID.trim() : null,
    keyword: LINE_KEYWORD,
  },
  hours: isPlaceholder(BUSINESS_HOURS) ? null : BUSINESS_HOURS.trim(),
  /** ชื่อค่าที่ยังเป็น placeholder หรือรูปแบบไม่ถูกต้อง */
  missing,
  /** true เมื่อโทรและ LINE พร้อมใช้งานจริงทั้งคู่ */
  live: telHref !== null && lineReady,
} as const;

export type ContactChannel = "call" | "line";
