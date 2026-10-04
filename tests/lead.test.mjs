import assert from "node:assert/strict";
import test from "node:test";
import {
  COST_CHECK_ITEMS,
  PROVINCES,
  countCostCheckFields,
  extract1688Url,
  lineMessageTemplate,
  normalizeThaiPhone,
  sanitizePlacement,
  summarizeLead,
  validateLead,
} from "../lib/lead.ts";

const base = { name: "สมชาย", phone: "0812345678", consent: true };

test("มีจังหวัดครบ 77 จังหวัด ไม่ซ้ำ", () => {
  assert.equal(PROVINCES.length, 77);
  assert.equal(new Set(PROVINCES).size, 77);
});

test("เบอร์ไทยแปลง +66 เป็น 0 และตัดขีด/ช่องว่าง", () => {
  assert.equal(normalizeThaiPhone("+66 81-234-5678"), "0812345678");
  assert.equal(normalizeThaiPhone("02-123-4567"), "021234567");
});

test("ดึงลิงก์ 1688 จากข้อความแชร์ และปฏิเสธเว็บอื่น", () => {
  assert.equal(extract1688Url("【1688】กระเป๋า https://qr.1688.com/s/AbC12 ดูเลย"), "https://qr.1688.com/s/AbC12");
  assert.equal(extract1688Url("detail.1688.com/offer/123.html"), "https://detail.1688.com/offer/123.html");
  assert.equal(extract1688Url("https://shopee.co.th/item"), null);
  assert.equal(extract1688Url("https://evil-1688.com.example.com/x"), null);
});

test("ชื่อ + เบอร์ + consent พอสำหรับ callback", () => {
  const result = validateLead(base);
  assert.equal(result.ok, true);
  assert.equal(result.lead.leadType, "callback");
  assert.equal(result.lead.fieldsCompleted, 0);
});

test("ครบ 3 ข้อ = cost_check และแปลงตัวเลขได้", () => {
  const result = validateLead({
    ...base,
    productUrl: "https://detail.1688.com/offer/1.html",
    quantity: "1,200 ชิ้น",
    variant: "สีดำ",
  });
  assert.equal(result.ok, true);
  assert.equal(result.lead.leadType, "cost_check");
  assert.equal(result.lead.quantity, 1200);
  assert.match(summarizeLead(result.lead), /แบบ\/สี\/รุ่น: สีดำ/);
});

test("แจ้ง error รายช่องเมื่อข้อมูลผิด", () => {
  const result = validateLead({ name: "a", phone: "123", quantity: "0", targetPrice: "abc", province: "โตเกียว" });
  assert.equal(result.ok, false);
  for (const field of ["name", "phone", "quantity", "targetPrice", "province", "consent"]) {
    assert.ok(result.errors[field], `ต้องมี error ที่ ${field}`);
  }
});

test("นับความครบของ Cost Check เฉพาะค่าที่ใช้ได้", () => {
  assert.equal(countCostCheckFields({ productUrl: "https://detail.1688.com/x", quantity: "abc", variant: "สีแดง" }), 2);
});

test("ข้อความ LINE มีคีย์เวิร์ดและ 5 หัวข้อ", () => {
  const message = lineMessageTemplate("คำนวณ");
  assert.equal(message.split("\n")[0], "คำนวณ");
  assert.equal(message.split("\n").length, COST_CHECK_ITEMS.length + 1);
});

test("placement รับเฉพาะ slug ปลอดภัย", () => {
  assert.equal(sanitizePlacement("Hero"), "hero");
  assert.equal(sanitizePlacement("<script>"), "website");
});
