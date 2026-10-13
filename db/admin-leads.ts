import { env } from "cloudflare:workers";
import type { LeadStatus } from "../lib/lead-status";

export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  lineId: string | null;
  interest: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  productUrl: string | null;
  quantity: string | null;
  variant: string | null;
  leadType: string | null;
  fieldsCompleted: number | null;
  productSnapshot: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  landingPath: string | null;
};

const MAX_ROWS = 1000;

function database() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  return env.DB;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

function toLead(r: Row): AdminLead {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    phone: String(r.phone ?? ""),
    lineId: str(r.line_id),
    interest: str(r.interest),
    source: str(r.source),
    status: String(r.status ?? "new"),
    createdAt: String(r.created_at ?? ""),
    productUrl: str(r.product_url),
    quantity: str(r.quantity),
    variant: str(r.variant),
    leadType: str(r.lead_type),
    fieldsCompleted: r.fields_completed === null || r.fields_completed === undefined ? null : Number(r.fields_completed),
    productSnapshot: str(r.product_snapshot),
    utmSource: str(r.utm_source),
    utmMedium: str(r.utm_medium),
    utmCampaign: str(r.utm_campaign),
    referrer: str(r.referrer),
    landingPath: str(r.landing_path),
  };
}

/** Lead ล่าสุดก่อน (สูงสุด 1,000 แถว) */
export async function listLeads(): Promise<AdminLead[]> {
  const { results } = await database()
    .prepare(
      `SELECT id, name, phone, line_id, interest, source, status, created_at,
              product_url, quantity, variant, lead_type, fields_completed, product_snapshot,
              utm_source, utm_medium, utm_campaign, referrer, landing_path
       FROM leads ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(MAX_ROWS)
    .all<Row>();
  return (results ?? []).map(toLead);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  const result = await database().prepare("UPDATE leads SET status = ? WHERE id = ?").bind(status, id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export type SnapshotCard = {
  title: string;
  image: string | null;
  url: string | null;
  priceMin: number | null;
  priceMax: number | null;
  moq: number | null;
  shop: string | null;
};

/** อ่าน product_snapshot แบบปลอดภัย (ข้อมูลเก่าอาจเป็น null/เสีย) */
export function parseSnapshot(raw: string | null): SnapshotCard | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const title = String(o.titleTh || o.title || "").trim();
    if (!title) return null;
    const image = typeof o.image === "string" && /^https:\/\//.test(o.image) ? o.image : null;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      title,
      image,
      url: typeof o.url === "string" ? o.url : null,
      priceMin: num(o.priceMinCny),
      priceMax: num(o.priceMaxCny),
      moq: num(o.moq),
      shop: typeof o.shopName === "string" ? o.shopName : null,
    };
  } catch {
    return null;
  }
}
