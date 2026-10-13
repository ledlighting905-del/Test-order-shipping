import { getChatGPTUser } from "../app/chatgpt-auth";
import { isAdminEmail } from "../config/admin";

/** ตรวจสิทธิ์สำหรับ API หลังบ้าน — คืนอีเมลถ้าผ่าน, null ถ้าไม่ผ่าน */
export async function adminEmailOrNull(): Promise<string | null> {
  const user = await getChatGPTUser();
  return user && isAdminEmail(user.email) ? user.email : null;
}
