import { NextResponse } from "next/server";
import { updateLeadStatus } from "../../../../db/admin-leads";
import { adminEmailOrNull } from "../../../../lib/admin-guard";
import { isLeadStatus } from "../../../../lib/lead-status";

const HEADERS = { "Cache-Control": "no-store" };
const reply = (body: Record<string, unknown>, status: number) => NextResponse.json(body, { status, headers: HEADERS });

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
  if (!isSameOrigin(request)) return reply({ error: "forbidden" }, 403);
  if (!(await adminEmailOrNull())) return reply({ error: "unauthorized" }, 401);

  let body: { id?: unknown; status?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; status?: unknown };
  } catch {
    return reply({ error: "bad_request" }, 400);
  }
  if (typeof body.id !== "string" || body.id.length > 100 || !isLeadStatus(body.status)) {
    return reply({ error: "bad_request" }, 400);
  }
  const ok = await updateLeadStatus(body.id, body.status);
  return ok ? reply({ ok: true }, 200) : reply({ error: "not_found" }, 404);
}

export function GET() {
  return reply({ error: "method_not_allowed" }, 405);
}
