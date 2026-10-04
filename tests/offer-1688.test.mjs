import assert from "node:assert/strict";
import test from "node:test";
import { parseOffer1688 } from "../lib/offer-1688.ts";

// โครงสร้างย่อของหน้า detail.1688.com (key ตัวเลขไม่มี quote แบบของจริง)
const html = `<script>(function(){})(window.contextPath,{"result":{"data":{
"Root":{"fields":{"dataJson":{
  "offerBaseInfo":{"offerId":845639520905,"sellerLoginId":"shop1688"},
  "orderParamModel":{"orderParam":{"beginNum":10,"skuParam":{"skuPriceType":"rangePrice","skuRangePrices":[{"price":"12.50","beginAmount":"10"},{"price":"9.80","beginAmount":"100"}]}}},
  "skuModel":{"skuInfoMap":{
    "红色&gt;M":{"skuId":111,"specAttrs":"红色&gt;M","price":"12.50","canBookCount":500},
    "蓝色&gt;L":{"skuId":222,"specAttrs":"蓝色&gt;L","discountPrice":"11.00","price":"12.50","canBookCount":300}
  }}
}}},
"productTitle":{"fields":{"title":"测试商品 收纳盒","unit":"个","shopInfo":{"companyName":"义乌测试工厂"}}},
"gallery":{"fields":{"offerImgList":["https://cbu01.alicdn.com/img/a.jpg"]}},
"shippingServices":{"fields":{"freightInfo":{"location":"浙江省金华市","skuWeight":{111:0.35,222:0.001}}}},
"productPackInfo":{"fields":{"pieceWeightScale":{"pieceWeightScaleInfo":[{"skuId":111,"length":20.0,"width":15.0,"height":10.0,"weight":350}]}}}
}}});</script>`;

test("แกะชื่อ ร้าน ราคา MOQ รุ่น น้ำหนัก ขนาด", () => {
  const offer = parseOffer1688(html, "https://detail.1688.com/offer/845639520905.html", "2026-01-01T00:00:00.000Z");
  assert.ok(offer);
  assert.equal(offer.offerId, "845639520905");
  assert.equal(offer.title, "测试商品 收纳盒");
  assert.equal(offer.shopName, "义乌测试工厂");
  assert.equal(offer.shipFrom, "浙江省金华市");
  assert.equal(offer.moq, 10);
  assert.deepEqual(offer.priceTiers, [{ minQty: 10, priceCny: 12.5 }, { minQty: 100, priceCny: 9.8 }]);
  assert.equal(offer.priceMinCny, 11);
  assert.equal(offer.priceMaxCny, 12.5);
  assert.equal(offer.variantCount, 2);
  assert.equal(offer.variants[0].name, "红色 / M");
  assert.deepEqual(offer.variants[0].sizeCm, { length: 20, width: 15, height: 10 });
  assert.equal(offer.variants[0].weightKg, 0.35);
  assert.equal(offer.hasWeight, true);
  assert.equal(offer.hasSize, true);
});

test("หน้าที่ไม่มีข้อมูลสินค้า คืน null", () => {
  assert.equal(parseOffer1688("<html><title>验证</title></html>", "https://detail.1688.com/offer/1.html"), null);
});
