/** สถานะ pipeline ของ Lead — ใช้ร่วมกันทั้งหน้าหลังบ้านและ API */
export const LEAD_STATUSES = [
  { value: "new", label: "ใหม่" },
  { value: "contacted", label: "ติดต่อแล้ว" },
  { value: "cost_sent", label: "ส่ง Cost Check แล้ว" },
  { value: "quoted", label: "ออกใบเสนอราคา" },
  { value: "won", label: "ปิดได้" },
  { value: "lost", label: "ปิดไม่ได้" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return LEAD_STATUSES.some((s) => s.value === value);
}

export function statusLabel(value: string): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.label ?? value;
}
