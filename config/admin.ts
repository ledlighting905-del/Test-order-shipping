/**
 * ผู้มีสิทธิ์เข้าหลังบ้าน (/admin/leads)
 * ล็อกอินด้วยบัญชี ChatGPT ผ่าน Sites แล้วตรวจอีเมลกับรายการนี้
 * เพิ่มเซลส์: ใส่อีเมลเพิ่มในอาร์เรย์ (ตัวพิมพ์เล็ก)
 */
export const ADMIN_EMAILS: readonly string[] = ["ledlighting905@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
