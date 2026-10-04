"use client";

import type { Offer1688 } from "../lib/offer-1688";

export type OfferPreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; offer: Offer1688 }
  | { status: "error"; message: string };

const cny = (value: number) => `¥${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** การ์ดสรุปสินค้าจาก 1688 ในฟอร์ม — ให้ลูกค้าเห็นว่าส่งลิงก์ถูกตัว และทีมได้ข้อมูลตั้งต้นทันที */
export function OfferPreview({ state, onRetry }: { state: OfferPreviewState; onRetry: () => void }) {
  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <div className="offer-preview is-loading" role="status">
        <span className="offer-spinner" aria-hidden="true" />
        <span>
          กำลังดึงข้อมูลสินค้าจาก 1688… <small>ใช้เวลาประมาณ 5–30 วินาที กรอกช่องอื่นต่อได้เลย</small>
        </span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="offer-preview is-error" role="status">
        <span>{state.message} — ส่งลิงก์ต่อได้ตามปกติ ทีมจะเปิดดูเอง</span>
        <button type="button" onClick={onRetry}>
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  const { offer } = state;
  const price =
    offer.priceMinCny === null
      ? "—"
      : offer.priceMaxCny !== null && offer.priceMaxCny !== offer.priceMinCny
        ? `${cny(offer.priceMinCny)} – ${cny(offer.priceMaxCny)}`
        : cny(offer.priceMinCny);

  return (
    <div className="offer-preview is-ready" role="status" aria-label="ข้อมูลสินค้าที่ดึงจาก 1688">
      {offer.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- รูปจาก CDN ของ 1688
        <img src={`${offer.image}_200x200.jpg`} alt="" width={72} height={72} loading="lazy" referrerPolicy="no-referrer" />
      ) : null}
      <div className="offer-body">
        <p className="offer-title" lang="zh">
          {offer.title}
        </p>
        <dl>
          <div>
            <dt>ราคาหน้าร้าน</dt>
            <dd>
              {price}
              {offer.unit ? ` / ${offer.unit}` : ""}
            </dd>
          </div>
          <div>
            <dt>ขั้นต่ำ</dt>
            <dd>{offer.moq ? `${offer.moq.toLocaleString("en-US")} ${offer.unit ?? "ชิ้น"}` : "—"}</dd>
          </div>
          <div>
            <dt>แบบ/รุ่น</dt>
            <dd>{offer.variantCount ? `${offer.variantCount} แบบ` : "แบบเดียว"}</dd>
          </div>
          <div>
            <dt>ส่งจาก</dt>
            <dd lang="zh">{offer.shipFrom ?? "—"}</dd>
          </div>
        </dl>
        <p className="offer-flags">
          <span className={offer.hasWeight ? "ok" : "warn"}>{offer.hasWeight ? "✓ มีน้ำหนัก" : "ไม่มีน้ำหนัก"}</span>
          <span className={offer.hasSize ? "ok" : "warn"}>{offer.hasSize ? "✓ มีขนาดกล่อง" : "ไม่มีขนาดกล่อง"}</span>
          <span className="note">ข้อมูลจากหน้าร้าน ทีมตรวจซ้ำก่อนเสนอราคา</span>
        </p>
      </div>
    </div>
  );
}
