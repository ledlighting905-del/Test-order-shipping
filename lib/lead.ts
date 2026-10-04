/**
 * Lead domain — ใช้ร่วมกันทั้งฟอร์มหน้าเว็บและ /api/leads
 * กติกาเดียว ตรวจสองฝั่ง: ฝั่งเว็บเพื่อ UX ฝั่ง API เพื่อความถูกต้องของข้อมูล
 */

export const LEAD_DEFAULT_TAG = "1688-cost-check";

export const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา",
  "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก",
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน",
  "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา",
  "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต",
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
  "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี",
  "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
] as const;

const PROVINCE_SET = new Set<string>(PROVINCES);

/** ข้อมูลที่ทีมต้องใช้ทำ Cost Check — ลำดับนี้ใช้ทั้งหน้าเว็บ ฟอร์ม และข้อความ LINE */
export const COST_CHECK_ITEMS = [
  { field: "productUrl", label: "ลิงก์สินค้า 1688", short: "ลิงก์ 1688" },
  { field: "quantity", label: "จำนวนที่จะสั่ง", short: "จำนวน" },
  { field: "variant", label: "แบบ / สี / รุ่น", short: "แบบ/สี/รุ่น" },
] as const;

export type CostCheckField = (typeof COST_CHECK_ITEMS)[number]["field"];
export type LeadField = "name" | "phone" | "lineId" | CostCheckField | "targetPrice" | "province" | "consent";
export type LeadFieldErrors = Partial<Record<LeadField, string>>;
export type LeadType = "cost_check" | "callback";

export type LeadDraft = {
  name: string;
  phone: string;
  lineId: string;
  productUrl: string;
  quantity: string;
  variant: string;
  targetPrice: string;
  province: string;
  consent: boolean;
};

export type ValidLead = {
  name: string;
  phone: string;
  lineId: string | null;
  productUrl: string | null;
  quantity: number | null;
  variant: string | null;
  targetPrice: number | null;
  province: string | null;
  fieldsCompleted: number;
  leadType: LeadType;
};

export type LeadAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  clickId: string | null;
  referrer: string | null;
  landingPath: string | null;
};

export const EMPTY_LEAD_DRAFT: LeadDraft = {
  name: "",
  phone: "",
  lineId: "",
  productUrl: "",
  quantity: "",
  variant: "",
  targetPrice: "",
  province: "",
  consent: false,
};

/** ข้อความต้นแบบให้ลูกค้าวางใน LINE */
export function lineMessageTemplate(keyword: string) {
  return [keyword, ...COST_CHECK_ITEMS.map((item, index) => `${index + 1}) ${item.short}: `)].join("\n");
}

/* ---------------------------- field parsers ---------------------------- */

type Parsed<T> = { value: T | null; error?: string };

const asText = (value: unknown) => (typeof value === "string" ? value : typeof value === "number" ? String(value) : "");
const squish = (value: unknown) => asText(value).replace(/\s+/g, " ").trim();

export function normalizeThaiPhone(raw: unknown) {
  const compact = asText(raw).replace(/[\s().-]/g, "");
  if (/^\+?66\d{8,9}$/.test(compact)) return `0${compact.replace(/^\+?66/, "")}`;
  return compact;
}

/** ดึง URL แรกจากข้อความ (ลูกค้ามักวางข้อความแชร์จากแอป 1688 มาทั้งก้อน) */
export function extract1688Url(raw: unknown): string | null {
  const text = asText(raw).trim();
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s<>"'，。【】]+/i) ?? text.match(/(?:^|\s)((?:[a-z0-9-]+\.)*1688\.com\/[^\s<>"'，。【】]*)/i);
  if (!match) return null;
  const candidate = match[0].trim().startsWith("http") ? match[0].trim() : `https://${(match[1] ?? match[0]).trim()}`;
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (host !== "1688.com" && !host.endsWith(".1688.com")) return null;
    url.protocol = "https:";
    url.hash = "";
    return url.toString().slice(0, 600);
  } catch {
    return null;
  }
}

function parseName(raw: unknown): Parsed<string> {
  const value = squish(raw);
  if (value.length < 2) return { value: null, error: "กรอกชื่ออย่างน้อย 2 ตัวอักษร" };
  if (value.length > 80) return { value: null, error: "ชื่อยาวเกิน 80 ตัวอักษร" };
  return { value };
}

function parsePhone(raw: unknown): Parsed<string> {
  if (!squish(raw)) return { value: null, error: "กรอกเบอร์โทรที่ติดต่อได้" };
  const value = normalizeThaiPhone(raw);
  if (!/^0\d{8,9}$/.test(value)) return { value: null, error: "เบอร์โทรไม่ถูกต้อง ใส่ 9–10 หลัก เช่น 08X-XXX-XXXX" };
  return { value };
}

function parseLineId(raw: unknown): Parsed<string> {
  const value = squish(raw).replace(/^line\s*id\s*[:：]?\s*/i, "");
  if (!value) return { value: null };
  if (value.length > 50 || !/^@?[a-z0-9._-]+$/i.test(value)) {
    return { value: null, error: "LINE ID ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีด และ _" };
  }
  return { value };
}

function parseProductUrl(raw: unknown): Parsed<string> {
  if (!squish(raw)) return { value: null };
  const value = extract1688Url(raw);
  if (!value) return { value: null, error: "ใส่ลิงก์สินค้าจาก 1688 เช่น https://detail.1688.com/offer/…" };
  return { value };
}

function parseNumber(raw: unknown) {
  const cleaned = asText(raw).replace(/[,\s฿]|บาท|ชิ้น|ตัว|pcs?/gi, "");
  if (!cleaned) return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

function parseQuantity(raw: unknown): Parsed<number> {
  const value = parseNumber(raw);
  if (value === null) return { value: null };
  if (!Number.isInteger(value) || value < 1 || value > 1_000_000) {
    return { value: null, error: "ใส่จำนวนเป็นตัวเลขเต็ม 1–1,000,000 เช่น 100" };
  }
  return { value };
}

function parseTargetPrice(raw: unknown): Parsed<number> {
  const value = parseNumber(raw);
  if (value === null) return { value: null };
  if (!Number.isFinite(value) || value <= 0 || value > 10_000_000) {
    return { value: null, error: "ใส่ราคาขายต่อชิ้นเป็นตัวเลข เช่น 199" };
  }
  return { value: Math.round(value * 100) / 100 };
}

function parseVariant(raw: unknown): Parsed<string> {
  const value = squish(raw);
  if (!value) return { value: null };
  if (value.length > 300) return { value: null, error: "รายละเอียดแบบ/สี/รุ่น ยาวเกิน 300 ตัวอักษร" };
  return { value };
}

function parseProvince(raw: unknown): Parsed<string> {
  const value = squish(raw);
  if (!value) return { value: null };
  if (!PROVINCE_SET.has(value)) return { value: null, error: "เลือกจังหวัดจากรายการ" };
  return { value };
}

function parseConsent(raw: unknown): Parsed<boolean> {
  const accepted = raw === true || raw === "true" || raw === "on" || raw === 1 || raw === "1";
  return accepted ? { value: true } : { value: null, error: "กดยินยอมก่อน เพื่อให้ทีมติดต่อกลับได้" };
}

const COST_CHECK_PARSERS: Record<CostCheckField, (raw: unknown) => Parsed<string | number>> = {
  productUrl: parseProductUrl,
  quantity: parseQuantity,
  variant: parseVariant,
};

/** นับว่าข้อมูล Cost Check ที่ "ใช้ได้จริง" ครบกี่ข้อจาก 5 */
export function countCostCheckFields(input: Partial<Record<CostCheckField, unknown>>) {
  return COST_CHECK_ITEMS.reduce((total, item) => {
    const parsed = COST_CHECK_PARSERS[item.field](input[item.field]);
    return total + (parsed.value !== null && !parsed.error ? 1 : 0);
  }, 0);
}

export function validateLead(input: Record<string, unknown>):
  | { ok: true; lead: ValidLead }
  | { ok: false; errors: LeadFieldErrors } {
  const parsed = {
    name: parseName(input.name),
    phone: parsePhone(input.phone),
    lineId: parseLineId(input.lineId),
    productUrl: parseProductUrl(input.productUrl),
    quantity: parseQuantity(input.quantity),
    variant: parseVariant(input.variant),
    targetPrice: parseTargetPrice(input.targetPrice),
    province: parseProvince(input.province),
    consent: parseConsent(input.consent),
  };

  const errors: LeadFieldErrors = {};
  for (const [field, result] of Object.entries(parsed) as [LeadField, Parsed<unknown>][]) {
    if (result.error) errors[field] = result.error;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const fieldsCompleted = COST_CHECK_ITEMS.filter((item) => parsed[item.field].value !== null).length;

  return {
    ok: true,
    lead: {
      name: parsed.name.value as string,
      phone: parsed.phone.value as string,
      lineId: parsed.lineId.value,
      productUrl: parsed.productUrl.value,
      quantity: parsed.quantity.value,
      variant: parsed.variant.value,
      targetPrice: parsed.targetPrice.value,
      province: parsed.province.value,
      fieldsCompleted,
      leadType: fieldsCompleted === COST_CHECK_ITEMS.length ? "cost_check" : "callback",
    },
  };
}

/** สรุปข้อความอ่านง่ายสำหรับคอลัมน์ interest เดิม (ระบบเก่ายังอ่านได้) */
export function summarizeLead(lead: ValidLead) {
  const parts = [
    lead.productUrl && `1688: ${lead.productUrl}`,
    lead.quantity !== null && `จำนวน ${lead.quantity.toLocaleString("en-US")}`,
    lead.variant && `แบบ/สี/รุ่น: ${lead.variant}`,
    lead.targetPrice !== null && `ตั้งใจขาย ${lead.targetPrice.toLocaleString("en-US")} บาท/ชิ้น`,
    lead.province && `ปลายทาง: ${lead.province}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" | ") : "ขอให้โทรกลับ (ยังไม่ได้ส่งข้อมูลสินค้า)";
}

const ATTRIBUTION_LIMITS: Record<keyof LeadAttribution, number> = {
  utmSource: 120,
  utmMedium: 120,
  utmCampaign: 200,
  utmContent: 200,
  utmTerm: 200,
  clickId: 300,
  referrer: 300,
  landingPath: 300,
};

export function sanitizeAttribution(raw: unknown): LeadAttribution {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result = {} as LeadAttribution;
  for (const [key, limit] of Object.entries(ATTRIBUTION_LIMITS) as [keyof LeadAttribution, number][]) {
    const value = squish(source[key]).slice(0, limit);
    result[key] = value || null;
  }
  return result;
}

export function sanitizePlacement(raw: unknown) {
  const value = squish(raw).toLowerCase();
  return /^[a-z0-9_-]{1,60}$/.test(value) ? value : "website";
}

export function isSubmissionId(raw: unknown): raw is string {
  return typeof raw === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
}
