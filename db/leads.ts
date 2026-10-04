import { env } from "cloudflare:workers";
import { LEAD_DEFAULT_TAG, summarizeLead, type LeadAttribution, type ValidLead } from "../lib/lead";

export type LeadInsert = {
  id: string;
  lead: ValidLead;
  source: string;
  attribution: LeadAttribution;
  productSnapshot?: string | null;
};

function database() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  return env.DB;
}

/**
 * บันทึก Lead — idempotent ตาม id (submission id จากฟอร์ม)
 * กดส่งซ้ำ/เน็ตกระตุกแล้ว retry จะไม่เกิดแถวซ้ำ
 */
export async function insertLead({ id, lead, source, attribution, productSnapshot = null }: LeadInsert) {
  const now = new Date().toISOString();
  const result = await database()
    .prepare(
      `INSERT INTO leads (
        id, name, phone, line_id, interest, source, status, created_at,
        product_url, quantity, variant, target_price, province,
        lead_type, fields_completed, tags, consent_at, product_snapshot,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, click_id, referrer, landing_path
      ) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING`,
    )
    .bind(
      id,
      lead.name,
      lead.phone,
      lead.lineId,
      summarizeLead(lead),
      source,
      now,
      lead.productUrl,
      lead.quantity,
      lead.variant,
      lead.targetPrice,
      lead.province,
      lead.leadType,
      lead.fieldsCompleted,
      JSON.stringify([LEAD_DEFAULT_TAG]),
      now,
      productSnapshot,
      attribution.utmSource,
      attribution.utmMedium,
      attribution.utmCampaign,
      attribution.utmContent,
      attribution.utmTerm,
      attribution.clickId,
      attribution.referrer,
      attribution.landingPath,
    )
    .run();

  return { duplicate: (result.meta?.changes ?? 1) === 0 };
}
