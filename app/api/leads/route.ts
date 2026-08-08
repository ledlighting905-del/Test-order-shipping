import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

type LeadPayload = {
  name?: unknown;
  phone?: unknown;
  lineId?: unknown;
  interest?: unknown;
  source?: unknown;
  website?: unknown;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (clean(payload.website, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(payload.name, 80);
  const phone = clean(payload.phone, 20);
  const lineId = clean(payload.lineId, 80);
  const interest = clean(payload.interest, 1200);
  const source = clean(payload.source, 200) || "Homepage";

  if (name.length < 2 || phone.length < 8 || interest.length < 3) {
    return NextResponse.json({ error: "กรุณากรอกชื่อ เบอร์โทร และสินค้าที่สนใจให้ครบ" }, { status: 422 });
  }

  const database = env.DB;
  await database.prepare(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      line_id TEXT,
      interest TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    )
  `).run();

  await database.prepare(`
    INSERT INTO leads (id, name, phone, line_id, interest, source, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
  `).bind(crypto.randomUUID(), name, phone, lineId || null, interest, source, new Date().toISOString()).run();

  return NextResponse.json({ ok: true }, { status: 201 });
}
