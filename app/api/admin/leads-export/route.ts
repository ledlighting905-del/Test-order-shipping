import { listLeads, parseSnapshot } from "../../../../db/admin-leads";
import { adminEmailOrNull } from "../../../../lib/admin-guard";
import { statusLabel } from "../../../../lib/lead-status";

/** กันสูตร Excel/Sheets (=,+,-,@) และ escape เครื่องหมายคำพูด */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await adminEmailOrNull())) {
    return new Response("unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const leads = await listLeads();
  const header = ["เวลา", "ชื่อ", "เบอร์", "LINE", "สถานะ", "ประเภท", "ลิงก์ 1688", "สินค้า", "จำนวน", "แบบ/สี/รุ่น", "utm_source", "utm_medium", "utm_campaign", "referrer", "id"];
  const rows = leads.map((l) => [
    l.createdAt, l.name, l.phone, l.lineId, statusLabel(l.status), l.leadType, l.productUrl,
    parseSnapshot(l.productSnapshot)?.title, l.quantity, l.variant, l.utmSource, l.utmMedium, l.utmCampaign, l.referrer, l.id,
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="china2thai-leads-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
