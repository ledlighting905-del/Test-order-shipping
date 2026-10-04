import assert from "node:assert/strict";
import test from "node:test";
import { glossaryTranslate, hasChinese, translateZhToTh } from "../lib/translate-zh.ts";

test("แปลชื่อรุ่น 1688 ที่พบบ่อยเป็นไทย", () => {
  assert.equal(glossaryTranslate("128型幻影紫台式三头冰淇淋机"), "รุ่น 128 ม่วงเงา ตั้งโต๊ะ 3 หัว เครื่องทำไอศกรีม");
  assert.equal(glossaryTranslate("68型橙黄色台式单头冰淇淋机"), "รุ่น 68 ส้มเหลือง ตั้งโต๊ะ หัวเดียว เครื่องทำไอศกรีม");
  assert.equal(glossaryTranslate("E27大螺口-36瓦 / 白光"), "E27 ขั้วเกลียวใหญ่ - 36 วัตต์ / แสงขาว");
  assert.equal(glossaryTranslate("双排模组-48W / 白光"), "2 แถว โมดูล -48W / แสงขาว");
});

test("ไม่มี API key ใช้พจนานุกรม", async () => {
  const result = await translateZhToTh(["298立式冰淇淋机"]);
  assert.equal(result.engine, "glossary");
  assert.equal(result.texts[0], "298 ตั้งพื้น เครื่องทำไอศกรีม");
  assert.equal(hasChinese(result.texts[0]), false);
});
