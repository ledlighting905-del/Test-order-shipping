"use client";

import { useEffect, useImperativeHandle, useRef, useState, type ChangeEvent, type FormEvent, type Ref } from "react";
import { contact } from "../config/contact";
import { track } from "../lib/analytics";
import { rememberAttribution } from "../lib/attribution";
import {
  COST_CHECK_ITEMS,
  extract1688Url,
  EMPTY_LEAD_DRAFT,
  PROVINCES,
  countCostCheckFields,
  validateLead,
  type LeadDraft,
  type LeadField,
  type LeadFieldErrors,
  type LeadType,
} from "../lib/lead";
import type { Offer1688 } from "../lib/offer-1688";
import { LineMark } from "./icons";
import { OfferPreview, type OfferPreviewState } from "./offer-preview";

export type LeadDialogReason = "callback" | "call_pending" | "line_pending";
export type LeadDialogHandle = { open: (request: { reason: LeadDialogReason; placement: string }) => void };

type Status = "idle" | "submitting" | "error";
type Success = { leadType: LeadType; fieldsCompleted: number };

const INTRO: Record<LeadDialogReason, { notice?: string; text: string }> = {
  callback: { text: "ใส่ชื่อกับเบอร์ก็พอ ถ้ามีข้อมูลสินค้าใส่มาด้วย ทีมจะเตรียม Cost Check ไว้ก่อนโทรกลับ" },
  call_pending: {
    notice: "สายโทรของเว็บกำลังตั้งค่า ฝากเบอร์ไว้ ทีมจะโทรหาคุณเอง",
    text: "ใส่ชื่อกับเบอร์ก็พอ ถ้ามีข้อมูลสินค้าใส่มาด้วย ทีมจะเตรียม Cost Check ไว้ก่อนโทรกลับ",
  },
  line_pending: {
    notice: "LINE OA ของเว็บกำลังตั้งค่า ส่งข้อมูลผ่านฟอร์มนี้แทนได้เลย",
    text: "กรอกข้อมูลสินค้าให้ครบ 5 ข้อ ทีมจะเช็กต้นทุนแล้วติดต่อกลับ",
  },
};

function newSubmissionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function LeadDialog({ ref }: { ref: Ref<LeadDialogHandle> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const backdropPressRef = useRef(false);
  const submitLockRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);
  const focusErrorRef = useRef(false);

  const [request, setRequest] = useState<{ reason: LeadDialogReason; placement: string }>({ reason: "callback", placement: "unknown" });
  const [draft, setDraft] = useState<LeadDraft>(EMPTY_LEAD_DRAFT);
  const [errors, setErrors] = useState<LeadFieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const [preview, setPreview] = useState<OfferPreviewState>({ status: "idle" });
  const previewUrlRef = useRef<string | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const previewDisabledRef = useRef(false);

  useImperativeHandle(ref, () => ({
    open(next) {
      setRequest(next);
      setSuccess(null);
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) dialog.showModal();
      track("open_callback_form", { placement: next.placement, reason: next.reason });
    },
  }));

  // ย้ายโฟกัสไปช่องแรกที่ผิด หลังแสดง error
  useEffect(() => {
    if (!focusErrorRef.current) return;
    focusErrorRef.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);

  const completed = countCostCheckFields(draft);
  const submitting = status === "submitting";
  const intro = INTRO[request.reason];

  function close() {
    dialogRef.current?.close();
  }

  function handleClosed() {
    returnFocusRef.current?.focus({ preventScroll: true });
  }

  function update(field: keyof LeadDraft) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setDraft((current) => ({ ...current, [field]: value }));
      if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  /** ดึงข้อมูลสินค้าจาก 1688 เมื่อได้ลิงก์ที่ถูกต้อง (ครั้งละลิงก์ ไม่ยิงซ้ำ) */
  async function loadPreview(raw: string, force = false) {
    const url = extract1688Url(raw);
    if (!url || previewDisabledRef.current) return;
    if (!force && previewUrlRef.current === url) return;
    previewUrlRef.current = url;
    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;
    setPreview({ status: "loading" });
    try {
      const response = await fetch("/api/product-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => ({}))) as { offer?: Offer1688; error?: string; configured?: boolean };
      if (controller.signal.aborted) return;
      if (data.configured === false) {
        previewDisabledRef.current = true;
        setPreview({ status: "idle" });
        return;
      }
      setPreview(response.ok && data.offer ? { status: "ready", offer: data.offer } : { status: "error", message: data.error ?? "ดึงข้อมูลสินค้าไม่สำเร็จ" });
    } catch {
      if (!controller.signal.aborted) setPreview({ status: "error", message: "เชื่อมต่อไม่สำเร็จ" });
    }
  }

  function fieldProps(field: LeadField) {
    const error = errors[field];
    return {
      id: `lead-${field}`,
      name: field,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `lead-${field}-error` : undefined,
    };
  }

  function fieldError(field: LeadField) {
    const error = errors[field];
    return error ? (
      <p className="field-error" id={`lead-${field}-error`}>
        {error}
      </p>
    ) : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current) return;

    const check = validateLead(draft);
    if (!check.ok) {
      focusErrorRef.current = true;
      setErrors(check.errors);
      setFormError("ตรวจช่องที่มีข้อความสีแดงอีกครั้ง");
      return;
    }

    submitLockRef.current = true;
    submissionIdRef.current ??= newSubmissionId();
    setStatus("submitting");
    setFormError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          website: honeypotRef.current?.value ?? "",
          submissionId: submissionIdRef.current,
          placement: request.placement,
          attribution: rememberAttribution(),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: LeadFieldErrors;
        leadType?: LeadType;
        fieldsCompleted?: number;
      };

      if (response.status === 422 && data.fieldErrors) {
        focusErrorRef.current = true;
        setErrors(data.fieldErrors);
        setFormError(data.error ?? "ตรวจช่องที่มีข้อความสีแดงอีกครั้ง");
        setStatus("idle");
        return;
      }
      if (!response.ok) throw new Error(data.error || "ส่งข้อมูลไม่สำเร็จ");

      const leadType = data.leadType ?? check.lead.leadType;
      const fieldsCompleted = data.fieldsCompleted ?? check.lead.fieldsCompleted;
      track(leadType === "cost_check" ? "submit_cost_check" : "submit_callback", {
        placement: request.placement,
        reason: request.reason,
        lead_type: leadType,
        fields_completed: fieldsCompleted,
      });

      setSuccess({ leadType, fieldsCompleted });
      setDraft(EMPTY_LEAD_DRAFT);
      setPreview({ status: "idle" });
      previewUrlRef.current = null;
      setErrors({});
      setStatus("idle");
      submissionIdRef.current = null;
    } catch (error) {
      setStatus("error");
      setFormError(
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "ส่งไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วกดส่งอีกครั้ง (ข้อมูลที่กรอกยังอยู่ครบ)",
      );
    } finally {
      submitLockRef.current = false;
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- คลิกพื้นหลังเพื่อปิด; คีย์บอร์ดใช้ Esc (native dialog)
    <dialog
      ref={dialogRef}
      className="lead-dialog"
      aria-labelledby="lead-dialog-title"
      onClose={handleClosed}
      onPointerDown={(event) => {
        backdropPressRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (backdropPressRef.current && event.target === event.currentTarget) close();
      }}
    >
      <div className="dialog-panel">
        <button className="dialog-close" type="button" onClick={close} aria-label="ปิดหน้าต่าง">
          <span aria-hidden="true">×</span>
        </button>

        {success ? (
          <div className="success-state" role="status">
            <span className="success-mark" aria-hidden="true">
              ✓
            </span>
            <h2 id="lead-dialog-title">รับข้อมูลแล้ว</h2>
            <p>
              {success.leadType === "cost_check"
                ? "ได้ข้อมูลครบ 5 ข้อ ทีมจะเช็กต้นทุนแล้วติดต่อกลับในเวลาทำการ"
                : "ทีมจะโทรกลับในเวลาทำการ เพื่อคุยรายละเอียดสินค้าที่เหลือ"}
              {contact.hours ? ` (${contact.hours})` : ""}
            </p>
            {contact.line.href ? (
              <a
                className="success-line"
                href={contact.line.href}
                target="_blank"
                rel="noopener noreferrer"
                data-track="click_line"
                data-placement="form-success"
                data-contact-ready="true"
                aria-label="ทัก LINE ส่งลิงก์เพิ่ม — เปิด LINE OA ในหน้าต่างใหม่"
              >
                <LineMark /> ทัก LINE ส่งลิงก์เพิ่ม
              </a>
            ) : null}
            <button className="success-close" type="button" onClick={close}>
              กลับไปหน้าเว็บ
            </button>
          </div>
        ) : (
          <>
            <p className="dialog-eyebrow">ช่องทางสำรอง · ฝากเบอร์ให้โทรกลับ</p>
            <h2 id="lead-dialog-title">
              ไม่สะดวกคุยตอนนี้?
              <br />
              <em>ฝากข้อมูลไว้</em>
            </h2>
            {intro.notice ? <p className="dialog-notice">{intro.notice}</p> : null}
            <p className="dialog-intro">{intro.text}</p>

            <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={submitting}>
              <fieldset className="form-group">
                <legend>ข้อมูลติดต่อ</legend>
                <div className="field">
                  <label htmlFor="lead-name">
                    ชื่อ <span className="req">*</span>
                  </label>
                  <input {...fieldProps("name")} value={draft.name} onChange={update("name")} autoComplete="name" maxLength={80} required placeholder="ชื่อที่ให้ทีมเรียก" />
                  {fieldError("name")}
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="lead-phone">
                      เบอร์โทร <span className="req">*</span>
                    </label>
                    <input {...fieldProps("phone")} value={draft.phone} onChange={update("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} required placeholder="08X-XXX-XXXX" />
                    {fieldError("phone")}
                  </div>
                  <div className="field">
                    <label htmlFor="lead-lineId">LINE ID</label>
                    <input {...fieldProps("lineId")} value={draft.lineId} onChange={update("lineId")} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={50} placeholder="ถ้ามี" />
                    {fieldError("lineId")}
                  </div>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <legend>
                  ข้อมูลสินค้าสำหรับ Cost Check
                  <span className="completion" aria-live="polite">
                    ครบ {completed}/{COST_CHECK_ITEMS.length}
                  </span>
                </legend>
                <div className="completion-bar" aria-hidden="true">
                  <span style={{ width: `${(completed / COST_CHECK_ITEMS.length) * 100}%` }} />
                </div>
                <p className="group-hint">ใส่ครบ 5 ข้อ ทีมเช็กต้นทุนได้ทันทีโดยไม่ต้องถามกลับ</p>

                <div className="field">
                  <label htmlFor="lead-productUrl">1) ลิงก์สินค้า 1688</label>
                  <input
                    {...fieldProps("productUrl")}
                    value={draft.productUrl}
                    onChange={(event) => {
                      update("productUrl")(event);
                      const pasted = event.nativeEvent instanceof InputEvent && event.nativeEvent.inputType === "insertFromPaste";
                      if (pasted) void loadPreview(event.target.value);
                    }}
                    onBlur={(event) => void loadPreview(event.target.value)}
                    inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={1000} placeholder="วางลิงก์หรือข้อความแชร์จากแอป 1688" />
                  {fieldError("productUrl")}
                  <OfferPreview state={preview} onRetry={() => void loadPreview(draft.productUrl, true)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="lead-quantity">2) จำนวน (ชิ้น)</label>
                    <input {...fieldProps("quantity")} value={draft.quantity} onChange={update("quantity")} inputMode="numeric" autoComplete="off" maxLength={12} placeholder="เช่น 200" />
                    {fieldError("quantity")}
                  </div>
                  <div className="field">
                    <label htmlFor="lead-targetPrice">4) ราคาที่ตั้งใจขาย (บาท/ชิ้น)</label>
                    <input {...fieldProps("targetPrice")} value={draft.targetPrice} onChange={update("targetPrice")} inputMode="decimal" autoComplete="off" maxLength={14} placeholder="เช่น 199" />
                    {fieldError("targetPrice")}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="lead-variant">3) แบบ / สี / รุ่น</label>
                  <input {...fieldProps("variant")} list={preview.status === "ready" && preview.offer.variants.length ? "lead-variant-options" : undefined} value={draft.variant} onChange={update("variant")} autoComplete="off" maxLength={300} placeholder="เช่น สีดำ ไซซ์ M รุ่นมีฝา" />
                  {fieldError("variant")}
                  {preview.status === "ready" && preview.offer.variants.length ? (
                    <datalist id="lead-variant-options">
                      {preview.offer.variants.map((variant) => (
                        <option key={variant.name} value={variant.name} />
                      ))}
                    </datalist>
                  ) : null}
                </div>
                <div className="field">
                  <label htmlFor="lead-province">5) จังหวัดปลายทาง</label>
                  <select {...fieldProps("province")} value={draft.province} onChange={update("province")}>
                    <option value="">เลือกจังหวัด</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  {fieldError("province")}
                </div>
              </fieldset>

              <div className="field consent-field">
                <label className="consent" htmlFor="lead-consent">
                  <input {...fieldProps("consent")} type="checkbox" checked={draft.consent} onChange={update("consent")} required />
                  <span>ยินยอมให้ CHINA2THAI เก็บข้อมูลนี้เพื่อติดต่อกลับและประเมินต้นทุนนำเข้า</span>
                </label>
                {fieldError("consent")}
              </div>

              <div className="honeypot" aria-hidden="true">
                <label htmlFor="lead-website">เว็บไซต์ (เว้นว่าง)</label>
                <input ref={honeypotRef} id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {formError ? (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <button className="submit-button" type="submit" disabled={submitting}>
                {submitting ? "กำลังส่ง…" : completed === COST_CHECK_ITEMS.length ? "ส่งข้อมูลให้ทีมเช็กต้นทุน →" : "ฝากเบอร์ให้ทีมโทรกลับ →"}
              </button>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
