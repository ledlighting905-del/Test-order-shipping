import { NextResponse } from "next/server";
import { extract1688Url } from "../../../lib/lead";
import { OfferServiceError, fetchOffer, isOfferServiceConfigured } from "../../../lib/offer-service";

const HEADERS = { "Cache-Control": "no-store" };

function reply(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: HEADERS });
}

/** รับเฉพาะคำขอจากหน้าเว็บเราเอง กันคนนอกยิงใช้โควตา */
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply({ error: "ไม่อนุญาต" }, 403);
  if (!isOfferServiceConfigured()) return reply({ error: "ยังไม่ได้ตั้งค่าระบบดึงข้อมูลสินค้า", configured: false }, 503);

  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return reply({ error: "ข้อมูลไม่ถูกต้อง" }, 400);
  }

  const url = extract1688Url(body.url);
  if (!url) return reply({ error: "ใส่ลิงก์สินค้าจาก 1688" }, 422);

  try {
    const offer = await fetchOffer(url);
    return reply({ ok: true, offer }, 200);
  } catch (error) {
    if (error instanceof OfferServiceError) return reply({ error: error.message }, error.status);
    console.error("[api/product-preview] failed", error);
    return reply({ error: "ดึงข้อมูลสินค้าไม่สำเร็จ" }, 500);
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { ...HEADERS, Allow: "POST" } });
}
