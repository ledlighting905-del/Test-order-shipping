import type { Metadata } from "next";
import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";
import { isAdminEmail } from "../../../config/admin";
import { listLeads, parseSnapshot, type AdminLead } from "../../../db/admin-leads";
import { LeadStatusSelect } from "../../../components/lead-status-select";
import { LEAD_STATUSES, isLeadStatus } from "../../../lib/lead-status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "หลังบ้าน Lead | CHINA2THAI",
  robots: { index: false, follow: false },
};

type Search = { status?: string; q?: string; type?: string };

const DAY = 86_400_000;
const when = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function fmtTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : when.format(d);
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function matches(l: AdminLead, q: string) {
  const hay = `${l.name} ${l.phone} ${l.lineId ?? ""} ${l.productUrl ?? ""} ${l.utmCampaign ?? ""}`.toLowerCase();
  return hay.includes(q);
}

function stats(leads: AdminLead[]) {
  const now = Date.now();
  const within = (days: number) => leads.filter((l) => now - new Date(l.createdAt).getTime() <= days * DAY);
  const week = within(7);
  const month = within(30);
  const complete = week.filter((l) => l.leadType === "cost_check").length;
  const campaigns = new Map<string, { n: number; complete: number }>();
  for (const l of month) {
    const key = l.utmCampaign || (l.utmSource ? `${l.utmSource} (ไม่มี campaign)` : "ตรง / ไม่ทราบที่มา");
    const c = campaigns.get(key) ?? { n: 0, complete: 0 };
    c.n += 1;
    if (l.leadType === "cost_check") c.complete += 1;
    campaigns.set(key, c);
  }
  const won = month.filter((l) => l.status === "won").length;
  return {
    total: leads.length,
    week: week.length,
    complete,
    completePct: week.length ? Math.round((complete / week.length) * 100) : 0,
    newCount: leads.filter((l) => l.status === "new").length,
    won,
    campaigns: [...campaigns.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 6),
  };
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireChatGPTUser("/admin/leads");

  if (!isAdminEmail(user.email)) {
    return (
      <main className="adm adm-narrow">
        <h1>ไม่มีสิทธิ์เข้าหน้านี้</h1>
        <p>บัญชี {user.email} ยังไม่ได้รับสิทธิ์ ให้แจ้งเจ้าของเพิ่มอีเมลใน <code>config/admin.ts</code></p>
        <p><a href={chatGPTSignOutPath("/admin/leads")}>สลับบัญชี</a></p>
      </main>
    );
  }

  const sp = await searchParams;
  const status = isLeadStatus(sp.status) ? sp.status : "";
  const type = sp.type === "cost_check" || sp.type === "callback" ? sp.type : "";
  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 80);

  const all = await listLeads();
  const s = stats(all);
  const rows = all.filter((l) => (!status || l.status === status) && (!type || l.leadType === type) && (!q || matches(l, q)));

  return (
    <main className="adm">
      <header className="adm-head">
        <div>
          <h1>หลังบ้าน · Lead ฝากสั่ง</h1>
          <p>ล็อกอินเป็น {user.email} · <a href={chatGPTSignOutPath("/admin/leads")}>ออกจากระบบ</a></p>
        </div>
        <a className="adm-btn" href="/api/admin/leads-export" download>ดาวน์โหลด CSV</a>
      </header>

      <section className="adm-kpis" aria-label="สรุปตัวเลข">
        <div><b>{s.week}</b><span>Lead 7 วันนี้</span></div>
        <div><b>{s.completePct}%</b><span>กรอกครบ 3 ช่อง ({s.complete}/{s.week})</span></div>
        <div><b>{s.newCount}</b><span>ยังไม่ได้ติดต่อ</span></div>
        <div><b>{s.won}</b><span>ปิดได้ 30 วัน</span></div>
        <div><b>{s.total}</b><span>ทั้งหมด</span></div>
      </section>

      {s.campaigns.length > 0 && (
        <section className="adm-camp" aria-label="Lead ตามแคมเปญ 30 วัน">
          <h2>ที่มา Lead 30 วัน</h2>
          <ul>
            {s.campaigns.map(([name, c]) => (
              <li key={name}><span>{name}</span><b>{c.n}</b><small>ครบ {c.complete}</small></li>
            ))}
          </ul>
        </section>
      )}

      <form className="adm-filter" method="get" role="search">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="ค้นหาชื่อ / เบอร์ / LINE / ลิงก์ / แคมเปญ" aria-label="ค้นหา" />
        <select name="status" defaultValue={status} aria-label="สถานะ">
          <option value="">ทุกสถานะ</option>
          {LEAD_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
        </select>
        <select name="type" defaultValue={type} aria-label="ประเภท">
          <option value="">ทุกประเภท</option>
          <option value="cost_check">Cost Check (ครบ)</option>
          <option value="callback">ขอให้โทรกลับ</option>
        </select>
        <button className="adm-btn" type="submit">กรอง</button>
      </form>

      <p className="adm-count">แสดง {rows.length} จาก {all.length} รายการ · ใหม่สุดก่อน</p>

      {rows.length === 0 ? (
        <p className="adm-empty">{all.length === 0 ? "ยังไม่มีลูกค้าฝากสั่งเข้ามา" : "ไม่พบรายการตามตัวกรอง"}</p>
      ) : (
        <ul className="adm-list">
          {rows.map((l) => {
            const p = parseSnapshot(l.productSnapshot);
            return (
              <li key={l.id} className="adm-card">
                <div className="adm-top">
                  <div>
                    <h3>{l.name}</h3>
                    <time dateTime={l.createdAt}>{fmtTime(l.createdAt)}</time>
                    <span className={`adm-tag ${l.leadType === "cost_check" ? "ok" : ""}`}>
                      {l.leadType === "cost_check" ? "Cost Check ครบ" : "ขอให้โทรกลับ"}
                    </span>
                  </div>
                  <LeadStatusSelect id={l.id} initial={l.status} />
                </div>

                <div className="adm-contact">
                  <a className="adm-btn call" href={telHref(l.phone)}>โทร {l.phone}</a>
                  {l.lineId && (
                    <a className="adm-btn line" href={`https://line.me/R/ti/p/~${encodeURIComponent(l.lineId)}`} target="_blank" rel="noopener noreferrer">
                      LINE {l.lineId}
                    </a>
                  )}
                </div>

                {(l.productUrl || p || l.quantity || l.variant) && (
                  <div className="adm-order">
                    {p?.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" width={72} height={72} loading="lazy" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      {p && <b>{p.title}</b>}
                      {p && (p.priceMin !== null || p.moq !== null) && (
                        <span>
                          {p.priceMin !== null && `¥${p.priceMin}${p.priceMax !== null && p.priceMax !== p.priceMin ? `–¥${p.priceMax}` : ""}`}
                          {p.moq !== null && ` · MOQ ${p.moq}`}
                          {p.shop && ` · ${p.shop}`}
                        </span>
                      )}
                      <span>จำนวน: {l.quantity || "—"} · แบบ/สี/รุ่น: {l.variant || "—"}</span>
                      {l.productUrl && (
                        <a href={l.productUrl} target="_blank" rel="noopener noreferrer">เปิดลิงก์ 1688</a>
                      )}
                    </div>
                  </div>
                )}

                <p className="adm-meta">
                  ที่มา: {l.utmSource || "ตรง"}{l.utmMedium ? ` / ${l.utmMedium}` : ""}{l.utmCampaign ? ` / ${l.utmCampaign}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
