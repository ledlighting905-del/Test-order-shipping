import { NextResponse } from "next/server";
import { insertLead } from "../../../db/leads";
import { isSubmissionId, sanitizeAttribution, sanitizePlacement, validateLead } from "../../../lib/lead";

const MAX_BODY_BYTES = 8_000;
const NO_STORE = { "Cache-Control": "no-store" };

function reply(body: Record<string, unknown>, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export async function POST(request: Request) {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return reply({ error: "ต้องส่งข้อมูลแบบ JSON" }, 415);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return reply({ error: "ข้อมูลยาวเกินไป" }, 413);

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    payload = parsed as Record<string, unknown>;
  } catch {
    return reply({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  }

  // Honeypot: คนจริงมองไม่เห็นช่องนี้ ถ้ามีค่า = bot ตอบสำเร็จแบบเงียบ ๆ ไม่บันทึก
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return reply({ ok: true }, 200);
  }

  const result = validateLead(payload);
  if (!result.ok) {
    return reply({ error: "ข้อมูลบางช่องยังไม่ถูกต้อง", fieldErrors: result.errors }, 422);
  }

  const id = isSubmissionId(payload.submissionId) ? payload.submissionId.toLowerCase() : crypto.randomUUID();

  try {
    const { duplicate } = await insertLead({
      id,
      lead: result.lead,
      source: sanitizePlacement(payload.placement),
      attribution: sanitizeAttribution(payload.attribution),
    });
    return reply(
      { ok: true, id, leadType: result.lead.leadType, fieldsCompleted: result.lead.fieldsCompleted, duplicate },
      duplicate ? 200 : 201,
    );
  } catch (error) {
    console.error("[api/leads] insert failed", error);
    return reply({ error: "ระบบบันทึกข้อมูลขัดข้องชั่วคราว กรุณาลองอีกครั้ง หรือโทร/ทัก LINE ได้เลย" }, 503);
  }
}

export function GET() {
  return reply({ error: "Method not allowed" }, 405, { Allow: "POST" });
}
