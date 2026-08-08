"use client";

import { FormEvent, useMemo, useState } from "react";

const categories = [
  { name: "แฟชั่นผู้หญิง", icon: "👗", key: "fashion" },
  { name: "กระเป๋า", icon: "👜", key: "bags" },
  { name: "รองเท้า", icon: "👟", key: "shoes" },
  { name: "เครื่องใช้ไฟฟ้า", icon: "🎧", key: "tech" },
  { name: "บ้านและสวน", icon: "🪑", key: "home" },
  { name: "บิวตี้", icon: "🧴", key: "beauty" },
  { name: "สัตว์เลี้ยง", icon: "🐾", key: "pet" },
  { name: "อะไหล่รถ", icon: "🚘", key: "auto" },
];

const products = [
  {
    name: "หูฟังบลูทูธ ANC รุ่นขายดี",
    category: "tech",
    yuan: "¥39.9",
    baht: "ประมาณ ฿205",
    badge: "MOQ 2 ชิ้น",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "รองเท้าผ้าใบสตรีทรง Retro",
    category: "shoes",
    yuan: "¥58",
    baht: "ประมาณ ฿298",
    badge: "ส่งไว 3 วัน",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "กระเป๋าสะพาย Minimal พร้อมสาย",
    category: "bags",
    yuan: "¥32.5",
    baht: "ประมาณ ฿167",
    badge: "สั่งทำ Logo ได้",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "เก้าอี้คาเฟ่ดีไซน์ Modern",
    category: "home",
    yuan: "¥118",
    baht: "ประมาณ ฿607",
    badge: "ราคาโรงงาน",
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "เซ็ตสกินแคร์บำรุงผิว 5 ชิ้น",
    category: "beauty",
    yuan: "¥29.9",
    baht: "ประมาณ ฿154",
    badge: "ฮิตใน Douyin",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "เดรสผู้หญิงทรงเกาหลี ผ้านิ่ม",
    category: "fashion",
    yuan: "¥45",
    baht: "ประมาณ ฿231",
    badge: "มี 6 สี",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "นาฬิกาข้อมือ Smart Casual",
    category: "fashion",
    yuan: "¥24.8",
    baht: "ประมาณ ฿128",
    badge: "พร้อมส่งจีน",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "ชามอาหารสัตว์เลี้ยง Ceramic",
    category: "pet",
    yuan: "¥18.9",
    baht: "ประมาณ ฿97",
    badge: "MOQ 10 ชิ้น",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=85",
  },
];

const features = [
  { no: "01", title: "ส่งลิงก์มา", text: "Taobao, 1688, Tmall หรือรูปสินค้า" },
  { no: "02", title: "เราเช็กให้", text: "ร้านค้า ราคา สเปก และค่าขนส่ง" },
  { no: "03", title: "จ่ายเป็นบาท", text: "ทีมจีนสั่งซื้อและตรวจรับสินค้า" },
  { no: "04", title: "รับของที่ไทย", text: "ติดตามสถานะได้จนถึงปลายทาง" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = activeCategory === "all" || product.category === activeCategory;
      const queryMatch = !normalized || product.name.toLowerCase().includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, query]);

  function openLeadForm(product = "") {
    setSelectedProduct(product);
    setModalOpen(true);
    setSuccess(false);
    setError("");
  }

  function searchProducts(event: FormEvent) {
    event.preventDefault();
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
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
          name: form.get("name"),
          phone: form.get("phone"),
          lineId: form.get("lineId"),
          interest: form.get("interest"),
          source: selectedProduct || "Homepage",
          website: form.get("website"),
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "ส่งข้อมูลไม่สำเร็จ");
      setSuccess(true);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <div className="announcement">
        <span>🔥 โปรใหม่: เช็กราคาสินค้าจีนฟรี 3 รายการ</span>
        <button type="button" onClick={() => openLeadForm("โปรโมชั่นเช็กราคาฟรี")}>รับสิทธิ์เลย →</button>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="China2Thai หน้าแรก">
            <span>CHINA</span><strong>2THAI</strong>
            <small>ของจีนง่ายกว่าที่คิด</small>
          </a>
          <nav className="top-nav" aria-label="เมนูหลัก">
            <a href="#categories">หมวดสินค้า</a>
            <a href="#how-it-works">วิธีสั่งซื้อ</a>
            <a href="#trust">ทำไมต้องเรา</a>
            <button type="button" onClick={() => openLeadForm("เมนูขอใบเสนอราคา")}>ขอใบเสนอราคา</button>
          </nav>
          <div className="header-actions">
            <button type="button" className="icon-button" aria-label="รายการที่สนใจ">♡</button>
            <button type="button" className="login-button" onClick={() => openLeadForm("สมัครสมาชิก")}>สมัครฟรี</button>
          </div>
        </div>
      </header>

      <section className="search-zone" id="top">
        <form className="search-bar" onSubmit={searchProducts}>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="ค้นหาสินค้า"
            placeholder="ค้นหาสินค้า หรือวางลิงก์ Taobao / 1688 ที่นี่"
          />
          <button type="submit">ค้นหาสินค้า</button>
        </form>
        <div className="search-tags" aria-label="คำค้นหายอดนิยม">
          <span>ค้นหายอดนิยม:</span>
          {["เสื้อผ้าแฟชั่น", "ของแต่งบ้าน", "อุปกรณ์ไลฟ์", "แพ็กเกจจิ้ง", "ไฟเวที"].map((tag) => (
            <button key={tag} type="button" onClick={() => { setQuery(tag); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}>{tag}</button>
          ))}
        </div>
      </section>

      <section className="market-shell" id="categories">
        <aside className="category-panel">
          <div className="category-heading"><span>☰</span> หมวดสินค้าทั้งหมด</div>
          <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")} type="button">
            <span aria-hidden="true">✨</span><b>สินค้ากำลังมาแรง</b><i>›</i>
          </button>
          {categories.map((category) => (
            <button className={activeCategory === category.key ? "active" : ""} key={category.key} onClick={() => { setActiveCategory(category.key); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} type="button">
              <span aria-hidden="true">{category.icon}</span><b>{category.name}</b><i>›</i>
            </button>
          ))}
        </aside>

        <div className="hero-banner">
          <div className="hero-copy">
            <p className="eyebrow">China sourcing made simple</p>
            <h1>อยากได้ของจีน<br /><em>เราเอามาให้</em></h1>
            <p className="hero-sub">ค้นหา เช็กร้าน สั่งซื้อ และนำเข้าไทย<br />จบครบในทีมเดียว</p>
            <div className="hero-actions">
              <button type="button" className="primary-cta" onClick={() => openLeadForm("Hero ขอเช็กราคา")}>ส่งลิงก์ให้เช็กราคา</button>
              <a href="#how-it-works">ดูวิธีสั่งซื้อ</a>
            </div>
            <div className="hero-proof">
              <span><b>ฟรี</b> เช็กราคา 3 รายการ</span>
              <span><b>15 นาที</b> ทีมงานติดต่อกลับ*</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=90" alt="" />
            <div className="floating-price"><small>เริ่มต้นเพียง</small><strong>¥ 12.9</strong><span>ราคาโรงงานจีน</span></div>
          </div>
          <p className="fineprint">*ในเวลาทำการ 09:00–18:00 น.</p>
        </div>

        <aside className="lead-teaser">
          <span className="teaser-badge">สำหรับคนขายออนไลน์</span>
          <div className="teaser-icon" aria-hidden="true">📦</div>
          <h2>ไม่รู้จะเริ่ม<br />นำเข้ายังไง?</h2>
          <p>รับคู่มือ “สั่งของจีนฉบับมือใหม่” พร้อมให้ทีมช่วยประเมินต้นทุน</p>
          <button type="button" onClick={() => openLeadForm("รับคู่มือนำเข้า")}>รับคู่มือฟรี</button>
          <small>ไม่มีค่าใช้จ่าย • ไม่ผูกมัด</small>
        </aside>
      </section>

      <section className="trust-strip" id="trust">
        <div><span>✓</span><p><b>มีทีมจีนดูแล</b><small>คุยกับร้านค้าแทนคุณ</small></p></div>
        <div><span>✓</span><p><b>เช็กของก่อนส่ง</b><small>ลดความเสี่ยงของไม่ตรงปก</small></p></div>
        <div><span>✓</span><p><b>จ่ายเงินเป็นบาท</b><small>ไม่ต้องมี Alipay</small></p></div>
        <div><span>✓</span><p><b>ติดตามสถานะได้</b><small>รู้ทุกขั้นตอนจนถึงไทย</small></p></div>
      </section>

      <section className="section products-section" id="products">
        <div className="section-title-row">
          <div>
            <p className="eyebrow orange">Trending from China</p>
            <h2>ของดีจากจีน <em>พร้อมทำกำไร</em></h2>
          </div>
          <div className="filter-pills" aria-label="กรองหมวดสินค้า">
            <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")} type="button">ทั้งหมด</button>
            {categories.slice(0, 4).map((category) => (
              <button className={activeCategory === category.key ? "active" : ""} key={category.key} onClick={() => setActiveCategory(category.key)} type="button">{category.name}</button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span>{product.badge}</span>
                  <button type="button" aria-label={`เก็บ ${product.name} ไว้ดูภายหลัง`}>♡</button>
                </div>
                <div className="product-info">
                  <p>{product.name}</p>
                  <div className="price-row">
                    <strong>{product.yuan}</strong>
                    <small>{product.baht}</small>
                  </div>
                  <button type="button" onClick={() => openLeadForm(product.name)}>ขอราคานำเข้า →</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>⌕</span><h3>ยังไม่พบสินค้าที่ค้นหา</h3><p>ส่งชื่อหรือรูปสินค้าให้ทีมจีนช่วยหาได้ฟรี</p>
            <button type="button" onClick={() => openLeadForm(`ค้นหา: ${query}`)}>ให้ทีมช่วยหา</button>
          </div>
        )}
        <p className="price-note">*ราคาประมาณการจากอัตราแลกเปลี่ยนตัวอย่าง ยังไม่รวมค่าขนส่งและบริการ กรุณาขอใบเสนอราคาจริงก่อนสั่งซื้อ</p>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section how-inner">
          <div className="how-heading">
            <p className="eyebrow">From China to Thailand</p>
            <h2>สั่งของจีนง่าย<br />แค่ <em>4 ขั้นตอน</em></h2>
            <p>เหมาะทั้งมือใหม่ ร้านค้าออนไลน์ และลูกค้าองค์กรที่ต้องการนำเข้าแบบจริงจัง</p>
            <button type="button" onClick={() => openLeadForm("เริ่มสั่งของจีน")}>เริ่มเช็กราคาฟรี</button>
          </div>
          <div className="step-grid">
            {features.map((feature) => (
              <article key={feature.no}><span>{feature.no}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section lead-section">
        <div className="lead-copy">
          <p className="eyebrow">Free sourcing consultation</p>
          <h2>มีสินค้าที่อยากนำเข้า?<br /><em>ส่งมาให้เราคิดต้นทุน</em></h2>
          <p>กรอกข้อมูล 30 วินาที ทีมงานช่วยเช็กร้าน ประเมินราคาสินค้า และค่าขนส่งเบื้องต้นให้ฟรี</p>
          <ul>
            <li>✓ เช็กราคาและ MOQ</li>
            <li>✓ ประเมินค่านำเข้า</li>
            <li>✓ แนะนำรูปแบบขนส่งที่คุ้มที่สุด</li>
          </ul>
        </div>
        <button className="big-lead-cta" type="button" onClick={() => openLeadForm("CTA ท้ายหน้า")}>
          <span>รับใบเสนอราคาฟรี</span><small>ทีมงานติดต่อกลับภายในเวลาทำการ</small><b>→</b>
        </button>
      </section>

      <footer>
        <div className="footer-brand"><span>CHINA</span><strong>2THAI</strong><p>ตัวช่วยสั่งของจีนสำหรับคนไทย</p></div>
        <div className="footer-links"><a href="#categories">หมวดสินค้า</a><a href="#how-it-works">วิธีสั่งซื้อ</a><button type="button" onClick={() => openLeadForm("Footer ติดต่อเรา")}>ติดต่อเรา</button></div>
        <p className="footer-note">เว็บไซต์นี้เป็นบริการช่วยค้นหา สั่งซื้อ และนำเข้าสินค้าจากจีน ไม่ได้เป็นส่วนหนึ่งของ Taobao หรือ Alibaba Group</p>
      </footer>

      <button className="floating-line" type="button" onClick={() => openLeadForm("ปุ่มลอยคุยกับทีมงาน")} aria-label="คุยกับทีมงาน">
        <span>LINE</span><b>คุยกับทีมงาน</b>
      </button>

      <nav className="mobile-nav" aria-label="เมนูมือถือ">
        <a href="#top"><span>⌂</span>หน้าแรก</a>
        <a href="#categories"><span>☷</span>หมวดสินค้า</a>
        <button type="button" onClick={() => openLeadForm("Mobile nav")}><span>＋</span>ขอราคา</button>
        <a href="#products"><span>⌕</span>ค้นหา</a>
      </nav>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-title">
            <button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="ปิดแบบฟอร์ม">×</button>
            {success ? (
              <div className="success-state">
                <span>✓</span><h2 id="lead-title">รับข้อมูลเรียบร้อย</h2><p>ทีมงานจะติดต่อกลับเพื่อช่วยเช็กราคาและวางแผนนำเข้าให้ครับ</p>
                <button type="button" onClick={() => setModalOpen(false)}>กลับไปดูสินค้า</button>
              </div>
            ) : (
              <>
                <span className="modal-label">ประเมินต้นทุนฟรี • ไม่มีค่าใช้จ่าย</span>
                <h2 id="lead-title">รับใบเสนอราคา<br /><em>จากทีมจีน</em></h2>
                <p>ฝากข้อมูลไว้ ทีมงานติดต่อกลับภายในเวลาทำการ</p>
                {selectedProduct && <div className="selected-product">สนใจ: {selectedProduct}</div>}
                <form onSubmit={submitLead}>
                  <label>ชื่อผู้ติดต่อ<input name="name" required maxLength={80} placeholder="ชื่อของคุณ" autoComplete="name" /></label>
                  <div className="form-row">
                    <label>เบอร์โทร<input name="phone" required inputMode="tel" maxLength={20} placeholder="08x-xxx-xxxx" autoComplete="tel" /></label>
                    <label>LINE ID<input name="lineId" maxLength={80} placeholder="LINE ID" /></label>
                  </div>
                  <label>สินค้าที่สนใจ / ลิงก์สินค้า<textarea name="interest" required maxLength={1200} rows={3} defaultValue={selectedProduct} placeholder="วางลิงก์ Taobao / 1688 หรือบอกรายละเอียดสินค้า" /></label>
                  <label className="consent"><input type="checkbox" required /> <span>ยินยอมให้ติดต่อกลับและใช้ข้อมูลเพื่อเสนอสินค้า/บริการตาม<a href="#privacy">นโยบายความเป็นส่วนตัว</a></span></label>
                  <label className="honeypot" aria-hidden="true">เว็บไซต์<input name="website" tabIndex={-1} autoComplete="off" /></label>
                  {error && <p className="form-error">{error}</p>}
                  <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลให้ทีมเช็กราคา →"}</button>
                  <small>ข้อมูลของคุณจะถูกเก็บอย่างปลอดภัย และไม่ส่งต่อบุคคลภายนอก</small>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
