"use client";

import { FormEvent, useState } from "react";

type ContactMode = "call" | "line" | null;

const checkItems = [
  { icon: "🔗", label: "ลิงก์สินค้า 1688" },
  { icon: "📦", label: "จำนวนที่ต้องการ" },
  { icon: "🎨", label: "แบบ / สี / รุ่น" },
  { icon: "💰", label: "ราคาที่ตั้งใจขาย" },
  { icon: "📍", label: "จังหวัดปลายทาง" },
];

const costRisks = [
  { no: "01", title: "ราคาหน้า 1688 ไม่ใช่ต้นทุนสุดท้าย", text: "ต้องดูจำนวนขั้นต่ำ ค่าส่งในจีน น้ำหนัก และค่าขนส่งมาไทยก่อนตัดสินใจ" },
  { no: "02", title: "ร้านถูก แต่กำไรอาจหาย", text: "สินค้าใหญ่ เบา หรือแพ็กไม่เหมาะ อาจทำให้ค่าขนส่งสูงกว่าที่วางไว้" },
  { no: "03", title: "สั่งผิดรุ่น แก้ทีหลังแพงกว่า", text: "ส่งรุ่น สี จำนวน และรูปอ้างอิงให้ครบก่อนให้ทีมประเมินต้นทุน" },
];

const steps = [
  { no: "1", title: "โทรหรือแอด LINE", text: "เลือกช่องทางที่สะดวก ไม่ต้องรอกรอกฟอร์มยาว" },
  { no: "2", title: "ส่งข้อมูล 5 อย่าง", text: "ลิงก์ จำนวน รุ่น ราคาขาย และจังหวัดปลายทาง" },
  { no: "3", title: "เช็กต้นทุนก่อนสั่ง", text: "ใช้ข้อมูลประกอบการตัดสินใจว่าจะสั่ง ปรับจำนวน หรือเปลี่ยนสินค้า" },
];

export default function Home() {
  const [contactMode, setContactMode] = useState<ContactMode>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function openContact(mode: Exclude<ContactMode, null>) { setContactMode(mode); }
  function openCallback() {
    setContactMode(null);
    setSuccess(false);
    setError("");
    setLeadOpen(true);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"), phone: form.get("phone"), lineId: form.get("lineId"),
          interest: form.get("interest"), source: "Call-first demo callback", website: form.get("website"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "ส่งข้อมูลไม่สำเร็จ");
      setSuccess(true);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally { setSubmitting(false); }
  }

  return (
    <main>
      <div className="demo-strip"><strong>ตัวอย่าง Call-first Website</strong><span>ปุ่มโทรและ LINE ยังไม่เชื่อมบัญชีจริง</span></div>

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="China2Thai หน้าแรก">
            <span>CHINA</span><strong>2THAI</strong><small>เห็นต้นทุนก่อนกดสั่ง 1688</small>
          </a>
          <nav className="top-nav" aria-label="เมนูหลัก">
            <a href="#why">ทำไมต้องเช็กต้นทุน</a><a href="#process">ขั้นตอน</a><a href="#prepare">เตรียมข้อมูล</a>
          </nav>
          <div className="header-actions">
            <button className="header-line" type="button" onClick={() => openContact("line")}><span>LINE</span> ส่งลิงก์ 1688</button>
            <button className="header-call" type="button" onClick={() => openContact("call")}><span aria-hidden="true">☎</span> โทรคุยทันที</button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-badge"><span>●</span> สำหรับพ่อค้าแม่ค้าออนไลน์ที่สั่งจาก 1688</div>
            <h1>ก่อนกดสั่ง 1688<br /><em>รู้ต้นทุนต่อชิ้นก่อน</em></h1>
            <p className="hero-lead">มีลิงก์สินค้าแล้ว โทรคุยกับทีมได้ทันที<br />เช็กข้อมูลให้ครบก่อนตัดสินใจสั่ง</p>
            <div className="hero-actions">
              <button className="call-cta" type="button" onClick={() => openContact("call")}>
                <span className="cta-icon" aria-hidden="true">☎</span><span><b>โทรคุยกับทีมทันที</b><small>เหมาะกับคนที่ต้องการคำตอบเร็ว</small></span>
              </button>
              <button className="line-cta" type="button" onClick={() => openContact("line")}>
                <span className="line-mark">LINE</span><span><b>ส่งลิงก์ทาง LINE</b><small>พิมพ์ “คำนวณ” แล้วส่งข้อมูล</small></span>
              </button>
            </div>
            <button className="callback-link" type="button" onClick={openCallback}>ไม่สะดวกคุยตอนนี้? ฝากเบอร์ให้โทรกลับ →</button>
            <div className="decision-points" aria-label="ประโยชน์ของการเช็กต้นทุน">
              <span><b>รู้ว่าต้องเช็กอะไร</b><small>ก่อนสั่งจริง</small></span>
              <span><b>คุยกับคนได้ทันที</b><small>ไม่ต้องรอแบบฟอร์ม</small></span>
              <span><b>ตัดสินใจง่ายขึ้น</b><small>จากข้อมูลที่ครบกว่า</small></span>
            </div>
          </div>

          <div className="hero-side" id="prepare">
            <div className="sourcing-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=90" alt="กล่องสินค้าที่เตรียมขนส่ง" />
              <span className="photo-label">CHINA → THAILAND</span>
            </div>
            <div className="cost-card">
              <div className="cost-card-head"><div><small>COST CHECK</small><h2>เตรียม 5 อย่างก่อนโทร</h2></div><span>5</span></div>
              <div className="check-list">
                {checkItems.map((item) => <div key={item.label}><span aria-hidden="true">{item.icon}</span><b>{item.label}</b><i>✓</i></div>)}
              </div>
              <button type="button" onClick={() => openContact("line")}>ดูตัวอย่างการส่งข้อมูลทาง LINE →</button>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <p><span>หลักคิดของเว็บนี้</span><b>ไม่บังคับกรอกฟอร์ม</b></p><p><span>ช่องทางหลัก</span><b>โทรทันที + LINE OA</b></p>
        <p><span>Offer</span><b>Cost Check ก่อนสั่ง</b></p><p><span>เป้าหมาย</span><b>เปลี่ยนผู้ชมเป็นบทสนทนา</b></p>
      </section>

      <section className="section risk-section" id="why">
        <div className="section-heading"><p>ทำไมลูกค้าถึงควรโทรก่อน</p><h2>3 เรื่องที่หน้าเว็บ<br /><em>ช่วยเตรียมก่อนคุย</em></h2></div>
        <div className="risk-grid">{costRisks.map((risk) => <article key={risk.no}><span>{risk.no}</span><h3>{risk.title}</h3><p>{risk.text}</p></article>)}</div>
      </section>

      <section className="process" id="process">
        <div className="section process-inner">
          <div className="process-copy"><p>จากคนดูเว็บ → ลูกค้าจริง</p><h2>เริ่มต้นง่าย<br /><em>ไม่ต้องกรอกยาว</em></h2><button type="button" onClick={() => openContact("call")}>☎ โทรคุยทันที</button></div>
          <div className="step-list">{steps.map((step) => <article key={step.no}><span>{step.no}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="section final-cta">
        <div><p>มีลิงก์ 1688 อยู่แล้ว?</p><h2>อย่าคิดต่อคนเดียว<br /><em>โทรคุยให้รู้เรื่อง</em></h2></div>
        <div className="final-actions">
          <button className="call-cta" type="button" onClick={() => openContact("call")}><span className="cta-icon">☎</span><span><b>โทรคุยทันที</b><small>ตัวอย่างปุ่มโทรออก</small></span></button>
          <button className="line-cta" type="button" onClick={() => openContact("line")}><span className="line-mark">LINE</span><span><b>ส่งลิงก์ทาง LINE</b><small>ดูข้อมูลที่ต้องส่ง</small></span></button>
        </div>
      </section>

      <footer><div className="footer-brand"><span>CHINA</span><strong>2THAI</strong></div><p>ตัวอย่าง Funnel สำหรับบริการนำเข้าสินค้าจากจีน</p><button type="button" onClick={openCallback}>ฝากเบอร์ให้โทรกลับ</button></footer>

      <div className="mobile-contact-bar" aria-label="ติดต่อด่วน">
        <button className="mobile-line" type="button" onClick={() => openContact("line")}><span>LINE</span> ส่งลิงก์</button>
        <button className="mobile-call" type="button" onClick={() => openContact("call")}><span>☎</span> โทรทันที</button>
      </div>

      {contactMode && (
        <div className="modal-backdrop">
          <section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-title">
            <button className="modal-close" type="button" onClick={() => setContactMode(null)} aria-label="ปิด">×</button>
            <div className={`contact-orb ${contactMode}`} aria-hidden="true">{contactMode === "call" ? "☎" : "LINE"}</div>
            <span className="demo-label">DEMO INTERACTION</span>
            <h2 id="contact-title">{contactMode === "call" ? "กดแล้วเปิดหน้าโทรออกทันที" : "กดแล้วเปิด LINE OA ทันที"}</h2>
            {contactMode === "call" ? <><p>เวอร์ชันจริงจะเชื่อมกับเบอร์ธุรกิจของพี่แบงค์ ลูกค้ากดครั้งเดียวแล้วโทรออกจากมือถือได้เลย</p><div className="demo-route"><span>ลูกค้ากด</span><i>→</i><span>หน้าจอโทรออก</span><i>→</i><span>ทีมขายรับสาย</span></div></> : <><p>เวอร์ชันจริงจะเปิด LINE OA พร้อมบอกลูกค้าให้พิมพ์ “คำนวณ” และส่งข้อมูล 5 อย่างนี้</p><div className="line-preview"><b>คำนวณ</b><span>1. ลิงก์ 1688</span><span>2. จำนวน</span><span>3. แบบ/สี/รุ่น</span><span>4. ราคาที่ตั้งใจขาย</span><span>5. จังหวัดปลายทาง</span></div></>}
            <div className="demo-warning">ต้องใส่เบอร์โทรและ LINE OA จริงก่อนเปิดใช้งาน</div>
            <button className="callback-button" type="button" onClick={openCallback}>ดูทางสำรอง: ฝากเบอร์ให้โทรกลับ →</button>
          </section>
        </div>
      )}

      {leadOpen && (
        <div className="modal-backdrop">
          <section className="callback-modal" role="dialog" aria-modal="true" aria-labelledby="callback-title">
            <button className="modal-close" type="button" onClick={() => setLeadOpen(false)} aria-label="ปิด">×</button>
            {success ? <div className="success-state"><span>✓</span><h2 id="callback-title">รับข้อมูลเรียบร้อย</h2><p>นี่คือตัวอย่างทางสำรองสำหรับลูกค้าที่ไม่สะดวกโทรตอนนี้</p><button type="button" onClick={() => setLeadOpen(false)}>กลับหน้าเว็บ</button></div> : <>
              <span className="demo-label">CALLBACK — ช่องทางสำรอง</span><h2 id="callback-title">ไม่สะดวกคุย?<br /><em>ฝากเบอร์ไว้</em></h2><p>ใช้เฉพาะคนที่ยังไม่พร้อมโทรหรือทัก LINE</p>
              <form onSubmit={submitLead}>
                <label>ชื่อผู้ติดต่อ<input name="name" required maxLength={80} placeholder="ชื่อของคุณ" autoComplete="name" /></label>
                <div className="form-row"><label>เบอร์โทร<input name="phone" required inputMode="tel" maxLength={20} placeholder="08x-xxx-xxxx" autoComplete="tel" /></label><label>LINE ID<input name="lineId" maxLength={80} placeholder="ถ้ามี" /></label></div>
                <label>สินค้าที่สนใจ / ลิงก์ 1688<textarea name="interest" required maxLength={1200} rows={3} placeholder="วางลิงก์ พร้อมจำนวนที่ต้องการ" /></label>
                <label className="consent"><input type="checkbox" required /><span>ยินยอมให้ทีมงานติดต่อกลับเกี่ยวกับบริการ</span></label>
                <label className="honeypot" aria-hidden="true">เว็บไซต์<input name="website" tabIndex={-1} autoComplete="off" /></label>
                {error && <p className="form-error">{error}</p>}<button className="submit-button" type="submit" disabled={submitting}>{submitting ? "กำลังส่ง..." : "ฝากข้อมูลให้ติดต่อกลับ →"}</button>
              </form>
            </>}
          </section>
        </div>
      )}
    </main>
  );
}
