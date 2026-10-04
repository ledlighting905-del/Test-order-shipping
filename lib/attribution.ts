import type { LeadAttribution } from "./lead";

const STORAGE_KEY = "c2t_attribution";
const CLICK_ID_PARAMS = ["fbclid", "gclid", "ttclid", "gbraid", "wbraid"] as const;

function fromLocation(): LeadAttribution {
  const params = new URLSearchParams(window.location.search);
  const clickParam = CLICK_ID_PARAMS.find((key) => params.get(key));
  const referrer = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : null;

  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    utmTerm: params.get("utm_term"),
    clickId: clickParam ? `${clickParam}:${params.get(clickParam)}` : null,
    referrer,
    landingPath: window.location.pathname,
  };
}

/**
 * จำแหล่งที่มาของผู้เข้าชมตลอด session (ใช้คำนวณ CPL ราย campaign)
 * ถ้า URL ปัจจุบันมี UTM/click id ใหม่ จะทับของเดิม; ไม่มีก็ใช้ค่าที่จำไว้
 */
export function rememberAttribution(): LeadAttribution {
  const current = fromLocation();
  const hasCampaign = Boolean(current.utmSource || current.utmCampaign || current.clickId);
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored && !hasCampaign) return JSON.parse(stored) as LeadAttribution;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // storage ถูกปิด (private mode ฯลฯ) — ใช้ค่าจาก URL ปัจจุบันแทน
  }
  return current;
}
