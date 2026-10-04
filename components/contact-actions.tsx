import type { ReactNode } from "react";
import { contact } from "../config/contact";

type ActionProps = {
  /** ตำแหน่งปุ่ม ใช้แยกผลใน tracking เช่น hero, header, sticky-bar */
  placement: string;
  /** ข้อความหลักที่มองเห็นบนปุ่ม (ใช้ประกอบ aria-label) */
  label: string;
  className?: string;
  children: ReactNode;
};

/**
 * ปุ่มโทร — ถ้าตั้งค่าเบอร์แล้วเป็นลิงก์ tel: จริง
 * ถ้ายังเป็น placeholder จะเปิดฟอร์มฝากเบอร์แทน ลูกค้าไม่เจอลิงก์เสีย
 */
export function CallAction({ placement, label, className, children }: ActionProps) {
  const shared = {
    className,
    "data-track": "click_call",
    "data-placement": placement,
    "data-contact-ready": String(contact.phone.ready),
  };

  if (contact.phone.href) {
    return (
      <a {...shared} href={contact.phone.href} aria-label={`${label} เบอร์ ${contact.phone.display}`}>
        {children}
      </a>
    );
  }

  return (
    <button {...shared} type="button" data-lead-open="call_pending" aria-haspopup="dialog" aria-label={`${label} — เปิดฟอร์มฝากเบอร์ให้ทีมโทรกลับ`}>
      {children}
    </button>
  );
}

/** ปุ่ม LINE — เปิด LINE OA ในแท็บ/แอปใหม่ หรือเปิดฟอร์มถ้ายังไม่ได้ตั้งค่า */
export function LineAction({ placement, label, className, children }: ActionProps) {
  const shared = {
    className,
    "data-track": "click_line",
    "data-placement": placement,
    "data-contact-ready": String(contact.line.ready),
  };

  if (contact.line.href) {
    return (
      <a {...shared} href={contact.line.href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — เปิด LINE OA ในหน้าต่างใหม่`}>
        {children}
      </a>
    );
  }

  return (
    <button {...shared} type="button" data-lead-open="line_pending" aria-haspopup="dialog" aria-label={`${label} — เปิดฟอร์มส่งข้อมูลแทน`}>
      {children}
    </button>
  );
}

/** ปุ่มเปิดฟอร์มฝากเบอร์ (ช่องทางสำรอง) */
export function CallbackTrigger({ placement, className, children }: Omit<ActionProps, "label">) {
  return (
    <button type="button" className={className} data-lead-open="callback" data-placement={placement} aria-haspopup="dialog">
      {children}
    </button>
  );
}
