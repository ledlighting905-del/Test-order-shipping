import { env } from "cloudflare:workers";
import { parseOffer1688, type Offer1688 } from "./offer-1688";
import { translateZhToTh } from "./translate-zh";

/**
 * ดึงข้อมูลสินค้า 1688 ผ่าน Oxylabs Web Scraper API (ฝั่ง server เท่านั้น)
 * Credentials มาจาก secret: OXYLABS_USERNAME / OXYLABS_PASSWORD — ห้ามใส่ในโค้ด
 * ผลลัพธ์ cache 6 ชั่วโมงต่อ URL เพื่อประหยัดโควตา
 */

const OXYLABS_ENDPOINT = "https://realtime.oxylabs.io/v1/queries";
const CACHE_TTL_SECONDS = 6 * 60 * 60;
const FETCH_TIMEOUT_MS = 40_000;

export class OfferServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function credentials() {
  const username = typeof env.OXYLABS_USERNAME === "string" ? env.OXYLABS_USERNAME : "";
  const password = typeof env.OXYLABS_PASSWORD === "string" ? env.OXYLABS_PASSWORD : "";
  return username && password ? { username, password } : null;
}

export function isOfferServiceConfigured() {
  return credentials() !== null;
}

function cacheKey(url: string) {
  const offerId = url.match(/offer\/(\d{6,15})\.html/)?.[1];
  return new Request(`https://offer-cache.china2thai.internal/v2/${offerId ?? encodeURIComponent(url)}`);
}

function cacheStore(): Cache | null {
  return typeof caches !== "undefined" && "default" in caches ? (caches as unknown as { default: Cache }).default : null;
}

export async function getCachedOffer(url: string): Promise<Offer1688 | null> {
  try {
    const hit = await cacheStore()?.match(cacheKey(url));
    return hit ? ((await hit.json()) as Offer1688) : null;
  } catch {
    return null;
  }
}

async function putCachedOffer(url: string, offer: Offer1688) {
  try {
    await cacheStore()?.put(
      cacheKey(url),
      new Response(JSON.stringify(offer), {
        headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}` },
      }),
    );
  } catch {
    // cache เป็นของเสริม — พลาดได้ไม่กระทบผลลัพธ์
  }
}

export async function fetchOffer(url: string): Promise<Offer1688> {
  const cached = await getCachedOffer(url);
  if (cached) return cached;

  const auth = credentials();
  if (!auth) throw new OfferServiceError("ยังไม่ได้ตั้งค่าระบบดึงข้อมูลสินค้า", 503);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let payload: { results?: { content?: string; status_code?: number; url?: string }[] };
  try {
    const response = await fetch(OXYLABS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${auth.username}:${auth.password}`)}`,
      },
      body: JSON.stringify({ source: "universal", url }),
      signal: controller.signal,
    });
    if (response.status === 401) throw new OfferServiceError("บัญชีดึงข้อมูลสินค้าใช้งานไม่ได้", 503);
    if (response.status === 402 || response.status === 429) throw new OfferServiceError("โควตาดึงข้อมูลสินค้าเต็มชั่วคราว", 503);
    if (!response.ok) throw new OfferServiceError("ดึงข้อมูลสินค้าไม่สำเร็จ", 502);
    payload = await response.json();
  } catch (error) {
    if (error instanceof OfferServiceError) throw error;
    throw new OfferServiceError(controller.signal.aborted ? "1688 ตอบช้าเกินไป ลองใหม่อีกครั้ง" : "ดึงข้อมูลสินค้าไม่สำเร็จ", 504);
  } finally {
    clearTimeout(timer);
  }

  const result = payload.results?.[0];
  if (!result?.content || (result.status_code && result.status_code >= 400)) {
    throw new OfferServiceError("ไม่พบสินค้านี้บน 1688 (ลิงก์อาจถูกลบหรือปิดการขาย)", 404);
  }

  const parsed = parseOffer1688(result.content, result.url ?? url);
  if (!parsed) throw new OfferServiceError("อ่านข้อมูลหน้าสินค้านี้ไม่ได้ ทีมจะเปิดดูเอง", 422);
  const offer = await withThai(parsed);

  await putCachedOffer(url, offer);
  return offer;
}

/** แปลชื่อสินค้าและชื่อรุ่นเป็นไทย (Google ถ้ามี GOOGLE_TRANSLATE_API_KEY ไม่งั้นพจนานุกรม) */
async function withThai(offer: Offer1688): Promise<Offer1688> {
  const key = typeof env.GOOGLE_TRANSLATE_API_KEY === "string" ? env.GOOGLE_TRANSLATE_API_KEY : undefined;
  const sources = [offer.title, ...offer.variants.map((variant) => variant.name)];
  const { texts, engine } = await translateZhToTh(sources, key);
  return {
    ...offer,
    titleTh: texts[0],
    translatedBy: engine,
    variants: offer.variants.map((variant, index) => ({ ...variant, nameTh: texts[index + 1] })),
  };
}

/** ย่อข้อมูลเก็บคู่กับ Lead (ไม่เก็บทุกรุ่นถ้ามีเยอะ) */
export function offerSnapshot(offer: Offer1688) {
  return JSON.stringify({ ...offer, variants: offer.variants.slice(0, 20) });
}
