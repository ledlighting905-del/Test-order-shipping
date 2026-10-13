"use client";

import { useState } from "react";
import { LEAD_STATUSES } from "../lib/lead-status";

export function LeadStatusSelect({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function change(next: string) {
    const prev = value;
    setValue(next);
    setState("saving");
    try {
      const res = await fetch("/api/admin/lead-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("saved");
    } catch {
      setValue(prev);
      setState("error");
    }
  }

  return (
    <label className="adm-status">
      <span className="adm-sr">สถานะ</span>
      <select value={value} onChange={(e) => void change(e.target.value)} disabled={state === "saving"} data-status={value}>
        {LEAD_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <small role="status" aria-live="polite">
        {state === "saving" ? "กำลังบันทึก…" : state === "saved" ? "บันทึกแล้ว" : state === "error" ? "บันทึกไม่สำเร็จ ลองใหม่" : ""}
      </small>
    </label>
  );
}
