import { CallAction, CallbackTrigger, LineAction } from "../components/contact-actions";
import { CopyTemplateButton } from "../components/copy-template-button";
import { LineMark, PhoneIcon } from "../components/icons";
import { SiteInteractions } from "../components/site-interactions";
import { contact } from "../config/contact";
import { COST_CHECK_ITEMS } from "../lib/lead";

const HERO_IMAGE = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=70";

const LINE_INSTRUCTION = `พิมพ์ “${contact.line.keyword}” แล้วส่งลิงก์ 1688 กับจำนวน`;

const costRisks = [
  {
    no: "01",
    title: "ราคาหน้า 1688 ยังไม่ใช่ต้นทุนจริง",
    text: "ยังต้องบวกค่าส่งในจีน ค่าขนส่งจีน–ไทย ภาษีและค่าธรรมเนียม ซึ่งขึ้นกับน้ำหนัก ขนาด และประเภทสินค้า",
  },
  {
    no: "02",
    title: "ของชิ้นใหญ่แต่เบา ค่าส่งอาจกินกำไร",
    text: "ค่าขนส่งมักคิดจากน้ำหนักหรือปริมาตร (CBM) ของที่แพ็กใหญ่จึงมีค่าส่งต่อชิ้นสูงกว่าที่คิด",
  },
  {
    no: "03",
    title: "สั่งผิดรุ่น แก้ทีหลังแพงกว่า",
    text: "ส่งแบบ สี รุ่น และจำนวนให้ครบตั้งแต่แรก ทีมจะประเมินจากสินค้าที่คุณตั้งใจสั่งจริง",
  },
];

const steps = [
  { title: "โทร หรือทัก LINE", text: `เลือกช่องทางที่สะดวก ถ้าทาง LINE ${LINE_INSTRUCTION}` },
  { title: `ส่งข้อมูล ${COST_CHECK_ITEMS.length} อย่าง`, text: COST_CHECK_ITEMS.map((item) => item.short).join(" · ") },
  { title: "รับ Cost Check", text: "ทีมประเมินต้นทุนต่อชิ้นโดยประมาณ รวมค่าขนส่งและภาษีที่เกี่ยวข้อง เทียบกับราคาที่คุณจะขาย" },
  { title: "ตัดสินใจแล้วค่อยสั่ง", text: "ตกลงสั่ง ทีมออกใบเสนอราคาให้ หรือจะปรับจำนวน/เปลี่ยนสินค้าก่อนก็ได้" },
];

const faqs = [
  {
    q: "Cost Check คืออะไร ได้อะไรบ้าง?",
    a: "คือการประเมินต้นทุนต่อชิ้นโดยประมาณจากลิงก์ 1688 ที่คุณส่งมา รวมค่าสินค้า ค่าขนส่งจีน–ไทย ภาษีและค่าธรรมเนียมที่เกี่ยวข้อง เพื่อให้เห็นว่าขายตามราคาที่ตั้งใจไว้แล้วเหลือกำไรประมาณเท่าไหร่",
  },
  {
    q: "ตัวเลขที่ได้คือราคาสุดท้ายเลยไหม?",
    a: "ยังไม่ใช่ เป็นตัวเลขประเมินเบื้องต้น ราคาจริงขึ้นกับน้ำหนักและขนาดจริงตอนแพ็ก อัตราแลกเปลี่ยน ค่าส่งในจีน และการพิจารณาของศุลกากร รายละเอียดทั้งหมดจะอยู่ในใบเสนอราคาก่อนคุณยืนยันสั่ง",
  },
  {
    q: "มีสินค้าที่นำเข้าไม่ได้หรือต้องขออนุญาตไหม?",
    a: "มี สินค้าบางประเภทต้องมีใบอนุญาตหรือมาตรฐานเพิ่ม เช่น อาหาร เครื่องสำอาง เครื่องใช้ไฟฟ้า และบางอย่างห้ามนำเข้า ส่งลิงก์มาก่อน ทีมจะแจ้งข้อจำกัดที่ตรวจพบระหว่างทำ Cost Check",
  },
  {
    q: "ขนส่งใช้เวลากี่วัน?",
    a: "ขึ้นกับวิธีขนส่งที่เลือก ช่วงเวลา และพิธีการศุลกากร ทีมจะแจ้งระยะเวลาโดยประมาณของแต่ละวิธีตอนเสนอราคา ระยะเวลาจริงอาจเปลี่ยนตามสถานการณ์",
  },
];

function CallButton({ placement, title, note }: { placement: string; title: string; note?: string }) {
  return (
    <CallAction placement={placement} label={title} className="call-cta">
      <span className="cta-icon">
        <PhoneIcon />
      </span>
      <span>
        <b>{title}</b>
        <small>{note ?? (contact.phone.display ? `โทร ${contact.phone.display}` : "กดเพื่อฝากเบอร์ ให้ทีมโทรกลับ")}</small>
      </span>
    </CallAction>
  );
}

function LineButton({ placement, title }: { placement: string; title: string }) {
  return (
    <LineAction placement={placement} label={title} className="line-cta">
      <LineMark />
      <span>
        <b>{title}</b>
        <small>{LINE_INSTRUCTION}</small>
      </span>
    </LineAction>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        ข้ามไปเนื้อหาหลัก
      </a>

      {contact.missing.length > 0 ? (
        <aside className="setup-strip" aria-label="สถานะการตั้งค่าช่องทางติดต่อ">
          <strong>ยังไม่ได้ตั้งค่าช่องทางติดต่อจริง</strong>
          <span>
            ขาด {contact.missing.join(", ")} · แก้ที่ <code>config/contact.ts</code>
          </span>
        </aside>
      ) : null}

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="CHINA2THAI กลับด้านบน">
            <span>CHINA</span>
            <strong>2THAI</strong>
            <small>รู้ต้นทุนก่อนกดสั่ง 1688</small>
          </a>
          <nav className="top-nav" aria-label="เมนูหลัก">
            <a href="#prepare">ต้องส่งอะไร</a>
            <a href="#why">ทำไมต้องเช็กก่อน</a>
            <a href="#process">ขั้นตอน</a>
            <a href="#faq">คำถามที่พบบ่อย</a>
          </nav>
          <div className="header-actions">
            <LineAction placement="header" label="ทัก LINE" className="header-line">
              <LineMark className="mini-line-mark" /> ทัก LINE
            </LineAction>
            <CallAction placement="header" label="โทรเลย" className="header-call">
              <PhoneIcon /> โทรเลย
            </CallAction>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="hero-badge">
                <span aria-hidden="true">●</span> สำหรับพ่อค้าแม่ค้าออนไลน์ที่สั่งของจาก 1688
              </p>
              <h1 id="hero-title">
                รู้ต้นทุน
                <br />
                <em>ก่อนกดสั่ง 1688</em>
              </h1>
              <p className="hero-lead">
                มีลิงก์สินค้าแล้ว แต่ยังไม่ชัวร์ว่าต้นทุนต่อชิ้นเท่าไหร่ ขายแล้วเหลือกำไรไหม — โทรหรือทัก LINE ส่งลิงก์มา ทีมช่วยเช็กต้นทุนให้ก่อนตัดสินใจสั่ง
              </p>
              <div className="hero-actions">
                <CallButton placement="hero" title="โทรคุยกับทีมทันที" />
                <LineButton placement="hero" title="ทัก LINE ส่งลิงก์ 1688" />
              </div>
              {contact.hours ? <p className="hours">เวลาทำการ: {contact.hours}</p> : null}
              <CallbackTrigger placement="hero" className="callback-link">
                ไม่สะดวกคุยตอนนี้? ฝากเบอร์ให้โทรกลับ →
              </CallbackTrigger>
              <ul className="decision-points" aria-label="สิ่งที่ได้จาก Cost Check">
                <li>
                  <b>รู้ต้นทุนต่อชิ้น</b>
                  <small>ก่อนจ่ายเงินจริง</small>
                </li>
                <li>
                  <b>เห็นกำไรคร่าว ๆ</b>
                  <small>เทียบกับราคาที่จะขาย</small>
                </li>
                <li>
                  <b>ตัดสินใจง่ายขึ้น</b>
                  <small>สั่ง ปรับจำนวน หรือเปลี่ยนสินค้า</small>
                </li>
              </ul>
            </div>

            <div className="hero-side" id="prepare">
              <figure className="sourcing-photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- รูปจาก CDN ภายนอก กำหนดขนาด/srcset เอง */}
                <img
                  src={`${HERO_IMAGE}&w=960`}
                  srcSet={`${HERO_IMAGE}&w=640 640w, ${HERO_IMAGE}&w=960 960w, ${HERO_IMAGE}&w=1280 1280w`}
                  sizes="(max-width: 760px) 92vw, 46vw"
                  width={960}
                  height={760}
                  alt="กล่องสินค้าที่แพ็กเตรียมขนส่งในคลังสินค้า"
                  fetchPriority="high"
                  decoding="async"
                />
                <figcaption className="photo-label">CHINA → THAILAND</figcaption>
              </figure>
              <div className="cost-card">
                <div className="cost-card-head">
                  <div>
                    <p className="cost-card-kicker">COST CHECK</p>
                    <h2>ส่ง {COST_CHECK_ITEMS.length} อย่างนี้ เช็กต้นทุนได้ครบ</h2>
                  </div>
                  <span aria-hidden="true">{COST_CHECK_ITEMS.length}</span>
                </div>
                <ol className="check-list">
                  {COST_CHECK_ITEMS.map((item, index) => (
                    <li key={item.field}>
                      <span aria-hidden="true">{index + 1}</span>
                      <b>{item.label}</b>
                    </li>
                  ))}
                </ol>
                <CopyTemplateButton className="copy-template" />
              </div>
            </div>
          </div>
        </section>

        <section className="trust-bar" aria-label="สรุปบริการ">
          <ul>
            <li>
              <span>ช่องทางหลัก</span>
              <b>โทร หรือ LINE OA</b>
            </li>
            <li>
              <span>สิ่งที่ได้</span>
              <b>ต้นทุนต่อชิ้นโดยประมาณ</b>
            </li>
            <li>
              <span>สิ่งที่ต้องส่ง</span>
              <b>ลิงก์ 1688 + จำนวน + แบบ/สี/รุ่น</b>
            </li>
            <li>
              <span>ไม่สะดวกคุย</span>
              <b>ฝากเบอร์ให้โทรกลับ</b>
            </li>
          </ul>
        </section>

        <section className="section risk-section" id="why" aria-labelledby="why-title">
          <div className="section-heading">
            <p className="eyebrow">ทำไมต้องเช็กก่อนสั่ง</p>
            <h2 id="why-title">
              3 จุดที่ทำให้กำไรหาย
              <br />
              <em>ตั้งแต่ก่อนกดสั่ง</em>
            </h2>
          </div>
          <div className="risk-grid">
            {costRisks.map((risk) => (
              <article key={risk.no}>
                <span aria-hidden="true">{risk.no}</span>
                <h3>{risk.title}</h3>
                <p>{risk.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="process" id="process" aria-labelledby="process-title">
          <div className="section process-inner">
            <div className="process-copy">
              <p className="eyebrow">ขั้นตอน</p>
              <h2 id="process-title">
                ส่งลิงก์ครั้งเดียว
                <br />
                <em>รู้ต้นทุนก่อนสั่ง</em>
              </h2>
              <CallAction placement="process" label="โทรคุยทันที" className="process-call">
                <PhoneIcon /> โทรคุยทันที
              </CallAction>
            </div>
            <ol className="step-list">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section faq" id="faq" aria-labelledby="faq-title">
          <div className="section-heading">
            <p className="eyebrow">ก่อนส่งลิงก์</p>
            <h2 id="faq-title">คำถามที่พบบ่อย</h2>
          </div>
          <div className="faq-list">
            {faqs.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section final-cta" aria-labelledby="final-title">
          <div>
            <p className="eyebrow">มีลิงก์ 1688 อยู่แล้ว?</p>
            <h2 id="final-title">
              ส่งมาให้เช็กก่อน
              <br />
              <em>ค่อยกดสั่ง</em>
            </h2>
          </div>
          <div className="final-actions">
            <CallButton placement="final" title="โทรคุยทันที" />
            <LineButton placement="final" title="ทัก LINE ส่งลิงก์" />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand" aria-hidden="true">
          <span>CHINA</span>
          <strong>2THAI</strong>
        </div>
        <div className="footer-info">
          <p>บริการนำเข้าสินค้าจากจีน · เช็กต้นทุนก่อนสั่ง 1688</p>
          {contact.phone.display || contact.line.id || contact.hours ? (
            <p>
              {[contact.phone.display && `โทร ${contact.phone.display}`, contact.line.id && `LINE ${contact.line.id}`, contact.hours && `เวลาทำการ ${contact.hours}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          <p className="footer-note">ตัวเลขจาก Cost Check เป็นการประเมินเบื้องต้น ราคาจริงยืนยันในใบเสนอราคา</p>
        </div>
        <CallbackTrigger placement="footer" className="footer-callback">
          ฝากเบอร์ให้โทรกลับ
        </CallbackTrigger>
      </footer>

      <nav className="mobile-contact-bar" aria-label="ติดต่อด่วน">
        <LineAction placement="sticky-bar" label="ทัก LINE ส่งลิงก์" className="mobile-line">
          <LineMark className="mini-line-mark" /> ทัก LINE ส่งลิงก์
        </LineAction>
        <CallAction placement="sticky-bar" label="โทรเลย" className="mobile-call">
          <PhoneIcon /> โทรเลย
        </CallAction>
      </nav>

      <SiteInteractions />
    </>
  );
}
