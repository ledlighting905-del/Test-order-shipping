"use client";

import { useRef, useState } from "react";
import { contact } from "../config/contact";
import { lineMessageTemplate } from "../lib/lead";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}

/** คัดลอกข้อความต้นแบบ ให้ลูกค้าไปวางใน LINE แล้วเติมข้อมูล */
export function CopyTemplateButton({ className }: { className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleCopy() {
    const copied = await copyText(lineMessageTemplate(contact.line.keyword));
    setState(copied ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2600);
  }

  const label =
    state === "copied" ? "คัดลอกแล้ว ไปวางในแชท LINE ได้เลย ✓" : state === "failed" ? "คัดลอกไม่ได้ พิมพ์ตามรายการด้านบนได้เลย" : "คัดลอกข้อความไปวางใน LINE";

  return (
    <button type="button" className={className} onClick={handleCopy}>
      <span aria-live="polite">{label}</span>
    </button>
  );
}
