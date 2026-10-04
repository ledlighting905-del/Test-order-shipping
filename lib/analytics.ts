import { TRACKING } from "../config/site";

/**
 * Tracking wrapper — จุดเดียวที่เว็บส่ง event ออกไป
 *
 * - push เข้า window.dataLayer เสมอ (GTM/GA4/Meta ผ่าน GTM อ่านจากตรงนี้)
 * - ส่งต่อ gtag / Meta Pixel เฉพาะเมื่อเปิดใน config/site.ts และสคริปต์โหลดอยู่จริง
 * - รองรับ provider ในอนาคตผ่าน registerAnalyticsProvider()
 * - ทุกขั้นห่อ try/catch: ไม่มีระบบ tracking ก็ไม่ทำให้เว็บพัง
 * - ห้ามส่งข้อมูลส่วนตัว (ชื่อ เบอร์ LINE ID ลิงก์) เข้า event
 */

export type TrackEventName =
  | "click_call"
  | "click_line"
  | "open_callback_form"
  | "submit_callback"
  | "submit_cost_check";

export type TrackParams = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsProvider = (event: TrackEventName, params: TrackParams) => void;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const TRACK_EVENTS = new Set<TrackEventName>([
  "click_call",
  "click_line",
  "open_callback_form",
  "submit_callback",
  "submit_cost_check",
]);

/** Meta standard events ที่ใช้ optimize ได้ — event อื่นส่งเป็น custom */
const META_STANDARD_EVENT: Partial<Record<TrackEventName, string>> = {
  click_call: "Contact",
  click_line: "Contact",
  submit_callback: "Lead",
  submit_cost_check: "Lead",
};

const providers = new Set<AnalyticsProvider>();

export function isTrackEventName(value: unknown): value is TrackEventName {
  return typeof value === "string" && TRACK_EVENTS.has(value as TrackEventName);
}

export function registerAnalyticsProvider(provider: AnalyticsProvider) {
  providers.add(provider);
  return () => {
    providers.delete(provider);
  };
}

function debugEnabled() {
  const { hostname, search } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1" || search.includes("debug_tracking=1");
}

function attempt(label: string, task: () => void) {
  try {
    task();
  } catch (error) {
    if (debugEnabled()) console.warn(`[track] ${label} failed`, error);
  }
}

function clean(params: TrackParams) {
  const output: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") output[key] = value;
  }
  return output;
}

export function track(event: TrackEventName, params: TrackParams = {}) {
  if (typeof window === "undefined") return;
  const scope = window as AnalyticsWindow;
  const payload = clean({ ...params, page_path: window.location.pathname });

  attempt("dataLayer", () => {
    scope.dataLayer = scope.dataLayer || [];
    scope.dataLayer.push({ event, ...payload });
  });

  if (TRACKING.FORWARD_TO_GTAG && typeof scope.gtag === "function") {
    attempt("gtag", () => scope.gtag?.("event", event, payload));
  }

  if (TRACKING.FORWARD_TO_META_PIXEL && typeof scope.fbq === "function") {
    const standard = META_STANDARD_EVENT[event];
    attempt("fbq", () =>
      standard ? scope.fbq?.("track", standard, { ...payload, c2t_event: event }) : scope.fbq?.("trackCustom", event, payload),
    );
  }

  for (const provider of providers) attempt("provider", () => provider(event, payload));

  if (debugEnabled()) console.info("[track]", event, payload);
}
