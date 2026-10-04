/**
 * Smoke test ของ production build (รันหลัง `npm run build`)
 * - ถ้าตั้ง BASE_URL จะทดสอบกับเซิร์ฟเวอร์นั้น
 * - ถ้าไม่ตั้ง จะเปิด wrangler dev จาก dist/ ให้อัตโนมัติ (local D1)
 * ไม่มีการเขียน Lead จริงลงฐานข้อมูล
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";

const BANNED_CLAIMS = ["ถูกที่สุด", "เร็วที่สุด", "รับประกันระยะเวลา", "รับประกันวัน", "ราคาคงที่", "ผ่านศุลกากรแน่นอน", "สินค้าทุกชนิดนำเข้าได้", "นำเข้าได้ทุกชนิด"];

let baseUrl = process.env.BASE_URL;
let server;

before(async () => {
  if (baseUrl) return;
  const port = 8800 + Math.floor(Math.random() * 100);
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", "dev", "--config", "dist/server/wrangler.json", "--local", "--persist-to", ".wrangler/state", "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", "0", "--show-interactive-dev-session=false"],
    { env: { ...process.env, WRANGLER_SEND_METRICS: "false", WRANGLER_LOG_PATH: ".wrangler/wrangler.log" }, stdio: ["ignore", "pipe", "pipe"] },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("wrangler dev did not start in 60s")), 60_000);
    const onData = (chunk) => {
      if (String(chunk).includes("Ready on")) {
        clearTimeout(timer);
        resolve();
      }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.on("exit", (code) => reject(new Error(`wrangler dev exited with ${code}`)));
  });
});

after(() => server?.kill());

async function home() {
  const response = await fetch(`${baseUrl}/`);
  return { response, html: await response.text() };
}

test("หน้าแรกตอบ 200 พร้อม headline และ meta ครบ", async () => {
  const { response, html } = await home();
  assert.equal(response.status, 200);
  assert.match(html, /<h1[^>]*>รู้ต้นทุน<br\/?><em>ก่อนกดสั่ง 1688<\/em><\/h1>/);
  assert.match(html, /<title>รู้ต้นทุนก่อนกดสั่ง 1688 \| CHINA2THAI<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/[^"]+\/og\.png"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+"/);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, "มี h1 เดียว");
});

test("ปุ่มโทร/LINE มีครบทุกตำแหน่ง และมี aria-label", async () => {
  const { html } = await home();
  const calls = html.match(/<(a|button)[^>]*data-track="click_call"[^>]*>/g) ?? [];
  const lines = html.match(/<(a|button)[^>]*data-track="click_line"[^>]*>/g) ?? [];
  assert.ok(calls.length >= 5, `ปุ่มโทร ${calls.length}`);
  assert.ok(lines.length >= 4, `ปุ่ม LINE ${lines.length}`);
  for (const tag of [...calls, ...lines]) assert.match(tag, /aria-label="[^"]+"/);
  for (const tag of calls) assert.match(tag, /href="tel:\+66\d{8,9}"|data-lead-open="call_pending"/);
  assert.match(html, /class="mobile-contact-bar"/);
});

test("ไม่มีข้อความอ้างเกินจริงที่ห้ามใช้", async () => {
  const { html } = await home();
  const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
  for (const claim of BANNED_CLAIMS) assert.ok(!text.includes(claim), `พบข้อความต้องห้าม: ${claim}`);
});

test("GET /api/leads ตอบ 405", async () => {
  const response = await fetch(`${baseUrl}/api/leads`);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("POST /api/leads ตรวจข้อมูลและตอบ 422 พร้อม error รายช่อง", async () => {
  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "a", phone: "1", productUrl: "https://shopee.co.th/x" }),
  });
  assert.equal(response.status, 422);
  const body = await response.json();
  assert.ok(body.fieldErrors.name && body.fieldErrors.phone && body.fieldErrors.productUrl && body.fieldErrors.consent);
});

test("POST /api/leads honeypot ตอบสำเร็จแบบเงียบ", async () => {
  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Bot", phone: "0812345678", consent: true, website: "spam" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
