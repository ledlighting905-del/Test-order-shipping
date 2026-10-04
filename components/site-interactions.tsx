"use client";

import { useEffect, useRef } from "react";
import { isTrackEventName, track } from "../lib/analytics";
import { rememberAttribution } from "../lib/attribution";
import { LeadDialog, type LeadDialogHandle, type LeadDialogReason } from "./lead-dialog";

const REASONS = new Set<LeadDialogReason>(["callback", "call_pending", "line_pending"]);

/**
 * Event delegation จุดเดียวของทั้งหน้า
 * - [data-track]      → ส่ง event (click_call / click_line)
 * - [data-lead-open]  → เปิดฟอร์มฝากเบอร์
 * markup ฝั่ง server จึงเป็น <a>/<button> ธรรมดา ใช้คีย์บอร์ดได้ครบ และโหลด JS น้อย
 */
export function SiteInteractions() {
  const dialog = useRef<LeadDialogHandle>(null);

  useEffect(() => {
    rememberAttribution();

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-track], [data-lead-open]") : null;
      if (!target) return;

      const placement = target.dataset.placement || "unknown";
      const eventName = target.dataset.track;
      if (isTrackEventName(eventName)) {
        track(eventName, { placement, contact_ready: target.dataset.contactReady === "true" });
      }

      const reason = target.dataset.leadOpen as LeadDialogReason | undefined;
      if (reason && REASONS.has(reason)) {
        event.preventDefault();
        dialog.current?.open({ reason, placement });
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return <LeadDialog ref={dialog} />;
}
