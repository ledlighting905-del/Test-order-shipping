/**
 * แกะข้อมูลสินค้าจากหน้า detail.1688.com (HTML ที่ได้จาก Oxylabs)
 * ข้อมูลอยู่ใน object ที่ฝังในสคริปต์ `window.contextPath,{...}` — เป็น JS object (key ตัวเลขไม่มี quote)
 * ไฟล์นี้ไม่มี dependency เพื่อให้ทดสอบด้วย node --test ได้ตรง ๆ
 */

export type OfferVariant = {
  name: string;
  /** ชื่อรุ่นภาษาไทย (เติมหลังแปล) */
  nameTh?: string;
  priceCny: number | null;
  stock: number | null;
  weightKg: number | null;
  sizeCm: { length: number; width: number; height: number } | null;
};

export type Offer1688 = {
  offerId: string;
  url: string;
  title: string;
  /** ชื่อสินค้าภาษาไทย (เติมหลังแปล) */
  titleTh?: string;
  translatedBy?: "google" | "mymemory" | "glossary";
  unit: string | null;
  shopName: string | null;
  shipFrom: string | null;
  image: string | null;
  moq: number | null;
  /** ถ้าร้านตั้งราคาตามจำนวน (rangePrice) จะเป็นขั้นราคาจริง; ถ้าเป็นราคาตามรุ่นจะว่าง */
  priceTiers: { minQty: number; priceCny: number }[];
  priceMinCny: number | null;
  priceMaxCny: number | null;
  variantCount: number;
  variants: OfferVariant[];
  /** มีน้ำหนักที่ดูสมเหตุสมผลอย่างน้อย 1 รุ่น */
  hasWeight: boolean;
  /** มีขนาดกล่องอย่างน้อย 1 รุ่น */
  hasSize: boolean;
  fetchedAt: string;
};

type Json = Record<string, unknown>;

function balancedObject(source: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return null;
}

function decodeEntities(value: string) {
  return value.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

const obj = (value: unknown): Json => (value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {});
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const num = (value: unknown) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};
const str = (value: unknown) => (typeof value === "string" && value.trim() ? decodeEntities(value.trim()) : null);

export function extractOfferData(html: string): Json | null {
  const marker = html.indexOf("window.contextPath,");
  if (marker < 0) return null;
  const start = html.indexOf("{", marker);
  const raw = start >= 0 ? balancedObject(html, start) : null;
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/([{,])(\d+):/g, '$1"$2":')) as Json;
  } catch {
    return null;
  }
}

export function parseOffer1688(html: string, url: string, fetchedAt = new Date().toISOString()): Offer1688 | null {
  const root = extractOfferData(html);
  const data = obj(obj(root?.result).data);
  if (!Object.keys(data).length) return null;

  const field = (component: string) => obj(obj(data[component]).fields);
  const dataJson = obj(field("Root").dataJson);
  const baseInfo = obj(dataJson.offerBaseInfo);
  const orderParam = obj(obj(dataJson.orderParamModel).orderParam);
  const skuModel = obj(dataJson.skuModel);
  const titleBlock = field("productTitle");
  const gallery = field("gallery");
  const shipping = field("shippingServices");
  const freight = obj(shipping.freightInfo);

  const offerId = String(num(baseInfo.offerId) ?? num(gallery.offerId) ?? "");
  const title = str(titleBlock.title) ?? str(gallery.subject);
  if (!offerId || !title) return null;

  const skuWeight = obj(freight.skuWeight);
  const packInfo = arr(obj(field("productPackInfo").pieceWeightScale).pieceWeightScaleInfo).map(obj);
  const packBySku = new Map(packInfo.map((item) => [String(item.skuId), item]));

  const variants: OfferVariant[] = Object.values(obj(skuModel.skuInfoMap))
    .map(obj)
    .map((sku) => {
      const skuId = String(sku.skuId ?? "");
      const pack = packBySku.get(skuId) ?? {};
      const length = num(pack.length) ?? 0;
      const width = num(pack.width) ?? 0;
      const height = num(pack.height) ?? 0;
      const weightKg = num(skuWeight[skuId]) ?? (num(pack.weight) !== null ? (num(pack.weight) as number) / 1000 : null);
      return {
        name: (str(sku.specAttrs) ?? "").replace(/>/g, " / "),
        priceCny: num(sku.discountPrice) ?? num(sku.price),
        stock: num(sku.canBookCount),
        weightKg: weightKg !== null && weightKg > 0 ? weightKg : null,
        sizeCm: length > 0 && width > 0 && height > 0 ? { length, width, height } : null,
      };
    });

  const skuParam = obj(orderParam.skuParam);
  const rangePrices = arr(skuParam.skuRangePrices)
    .map(obj)
    .map((tier) => ({ minQty: num(tier.beginAmount) ?? 1, priceCny: num(tier.price) }))
    .filter((tier): tier is { minQty: number; priceCny: number } => tier.priceCny !== null);
  const isQuantityTiered = skuParam.skuPriceType === "rangePrice";

  const variantPrices = variants.map((variant) => variant.priceCny).filter((price): price is number => price !== null);
  const allPrices = variantPrices.length ? variantPrices : rangePrices.map((tier) => tier.priceCny);
  const images = arr(gallery.offerImgList ?? gallery.mainImage);

  return {
    offerId,
    url,
    title,
    unit: str(titleBlock.unit),
    shopName: str(obj(titleBlock.shopInfo).companyName) ?? str(baseInfo.sellerLoginId),
    shipFrom: str(freight.location) ?? str(shipping.location),
    image: str(images[0]),
    moq: num(orderParam.beginNum) ?? num(shipping.startAmount),
    priceTiers: isQuantityTiered ? rangePrices : [],
    priceMinCny: allPrices.length ? Math.min(...allPrices) : null,
    priceMaxCny: allPrices.length ? Math.max(...allPrices) : null,
    variantCount: variants.length,
    variants: variants.slice(0, 60),
    // น้ำหนักต่ำกว่า 5 กรัมมักเป็นค่าที่ร้านกรอกผิด
    hasWeight: variants.some((variant) => variant.weightKg !== null && variant.weightKg >= 0.005),
    hasSize: variants.some((variant) => variant.sizeCm !== null),
    fetchedAt,
  };
}
