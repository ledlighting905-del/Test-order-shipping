import assert from "node:assert/strict";
import test from "node:test";
import { glossaryTranslate, hasChinese, translateZhToTh } from "../lib/translate-zh.ts";

test("แปลชื่อรุ่น 1688 ที่พบบ่อยเป็นไทย", () => {
  assert.equal(glossaryTranslate("128型幻影紫台式三头冰淇淋机"), "รุ่น 128 ม่วงเงา ตั้งโต๊ะ 3 หัว เครื่องทำไอศกรีม");
  assert.equal(glossaryTranslate("68型橙黄色台式单头冰淇淋机"), "รุ่น 68 ส้มเหลือง ตั้งโต๊ะ หัวเดียว เครื่องทำไอศกรีม");
  assert.equal(glossaryTranslate("E27大螺口-36瓦 / 白光"), "E27 ขั้วเกลียวใหญ่ - 36 วัตต์ / แสงขาว");
  assert.equal(glossaryTranslate("双排模组-48W / 白光"), "2 แถว โมดูล -48W / แสงขาว");
});

test("พจนานุกรมแปลครบ ไม่เรียก API", async () => {
  let called = false;
  const result = await translateZhToTh(["298立式冰淇淋机"], { fetcher: async () => { called = true; throw new Error("no"); } });
  assert.equal(called, false);
  assert.equal(result.engine, "glossary");
  assert.equal(result.texts[0], "298 ตั้งพื้น เครื่องทำไอศกรีม");
  assert.equal(hasChinese(result.texts[0]), false);
});

test("คำที่พจนานุกรมไม่รู้จัก ส่งไปแปลด้วย MyMemory แบบรวมบรรทัด", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: "หน้าจอ [สะกด 4 วรรณยุกต์] A221\nไม่มีหน้าจอ [เครื่องฝึกพินอิน] A230" } }));
  };
  const result = await translateZhToTh(["屏幕款【四声调拼读】A221", "无屏款【拼音训练学习机】A230", "E27大螺口-36瓦 / 白光"], { fetcher });
  assert.equal(calls.length, 1);
  assert.equal(result.engine, "mymemory");
  assert.deepEqual(result.texts, ["หน้าจอ [สะกด 4 วรรณยุกต์] A221", "ไม่มีหน้าจอ [เครื่องฝึกพินอิน] A230", "E27 ขั้วเกลียวใหญ่ - 36 วัตต์ / แสงขาว"]);
});

test("API ล่ม ใช้พจนานุกรมเท่าที่แปลได้", async () => {
  const result = await translateZhToTh(["无屏款【拼音训练学习机】A230"], { fetcher: async () => new Response("err", { status: 500 }) });
  assert.equal(result.engine, "glossary");
  assert.ok(result.texts[0].length > 0);
});
