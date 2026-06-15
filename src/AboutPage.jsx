import { useEffect, useState, useRef } from "react";
import mesobLogo from "./assets/mesoblogo.jpg";
import "./about.css";

const VALUES = [
  { icon: "⚡", en_title: "Efficiency",        am_title: "ቅልጥፍና",       en_body: "We eliminate bureaucratic delays. Access multiple government services in a single visit — saving your time and reducing unnecessary paperwork.",                                                                                            am_body: "የስራ ሂደቶችን በማቀላጠፍ የተገልጋዮችን ጊዜ እና ወጪ እንቆጥባለን። በአንድ ጉብኝት ብዙ አገልግሎቶችን ማግኘት ይችላሉ።" },
  { icon: "🌍", en_title: "Accessibility",      am_title: "ተደራሽነት",      en_body: "We serve every resident of Hawassa City — regardless of background — with inclusive, dignified, and equitable service delivery.",                                                                               am_body: "የሀዋሳ ከተማ ነዋሪዎች በሙሉ እኩል ዕድል እንዲያገኙ ተደራሽ፣ አካታች እና ፍትሃዊ አገልግሎት እንሰጣለን።" },
  { icon: "💻", en_title: "Digital Innovation", am_title: "ዲጂታል ፈጠራ",  en_body: "Powered by locally developed technology, MESOB Hawassa integrates digital portals, mobile access, and in-person service points for a seamless experience.",                                                                              am_body: "በዘመናዊ ቴክኖሎጂ የተደገፈው መሶብ ሀዋሳ የዲጂታል ሥርዓቶችን፣ የሞባይል አገልግሎቶችን እና የፊት ለፊት አገልግሎቶችን በማቀናጀት ቀላልና ተስማሚ የተገልጋይ ተሞክሮ ያቀርባል።" },
  { icon: "🏛",  en_title: "Transparency",      am_title: "ግልጽነት",       en_body: "Clear processes, visible fees, and accountable staff. Citizens can track their service requests in real time, building lasting trust in public institutions.",                                                                                  am_body: "ግልጽ የአሠራር ሂደቶች፣ የሚታዩ ክፍያዎች እና ተጠያቂ ሰራተኞች የአገልግሎታችን መሠረት ናቸው። ተገልጋዮች የጥያቄያቸውን ሂደት በቀላሉ መከታተል ይችላሉ።" },
];

const STATS = [
  { number: "15+",  en: "Gov't services",  am: "የመንግሥት አገልግሎቶች" },
  { number: "1",    en: "Visit needed",    am: "አንድ ጉብኝት ብቻ" },
  { number: "24/7", en: "Online portal",   am: "ኦንላይን ፖርታል" },
  { number: "100K+",en: "Citizens served", am: "ያገለገልናቸው ዜጎች" },
];

const HISTORY = [
  { year: "APRIL 26, 2025",  en: "Prime Minister Abiy Ahmed inaugurates the first MESOB One-Stop Service Center in Addis Ababa, integrating 12 government ministries and 41 services.", am: "መሶብ በኢትዮጵያ በይፋ የተጀመረው ሚያዝያ 18 ቀን 2017 ዓ.ም ሲሆን፣ ጠቅላይ ሚኒስትር ዶክተር ዐቢይ አህመድ በአዲስ አበባ የመጀመሪያውን የመሶብ የአንድ ማዕከል አገልግሎት በይፋ አስመርቀዋል።" },
  { year: "LATE 2025–2026",  en: "The MESOB model expanded to additional locations and regions, improving citizen access to government services.",                                         am: "የመሶብ አገልግሎት በሀገር አቀፍ ደረጃ ወደ ክልሎች ተስፋፋ፣ ሲዳማ ክልልንም አካተተ።" },
  { year: "MAY 27, 2026",    en: "MESOB Hawassa Branch officially commenced service delivery to the residents of Hawassa City . The branch was established to provide integrated, efficient, and citizen-centered government services through a modern one-stop service center.", am: "ግንቦት 19 ቀን 2018 ዓ.ም. — የሀዋሳ መሶብ  ለሀዋሳ ከተማ ነዋሪዎች የተቀናጀ የመንግስት አገልግሎት በይፋ መስጠት ጀመረ። ቅርንጫፉ ዘመናዊ፣ ፈጣን፣ ግልጽ እና ተገልጋይ ተኮር አገልግሎት ለመስጠት ተቋቁሟል።" },
];

const SERVICES = [
  { icon: "🪪", en: "National ID (Fayda)",          am: "ብሔራዊ መታወቂያ (ፋይዳ)",      desc: "Enroll or update your national Fayda ID. Bring original documents and a recent photo." },
  { icon: "✈️", en: "Immigration & Passport",        am: "ኢሚግሬሽንና ፓስፖርት",           desc: "Apply for or renew Ethiopian passports and immigration permits at the counter." },
  { icon: "📄", en: "Document Authentication",       am: "ሰነድ ማረጋገጫ",               desc: "Official notarisation and authentication of civil and legal documents." },
  { icon: "💰", en: "Ministry of Revenue",           am: "የገቢዎች ሚኒስቴር",             desc: "Tax registration, TIN issuance, and revenue-related transactions." },
  { icon: "🏦", en: "Commercial Bank of Ethiopia",   am: "የኢትዮጵያ ንግድ ባንክ",          desc: "Open accounts, transfer funds, and access CBE banking services on-site." },
  { icon: "📡", en: "Ethio Telecom Services",        am: "የኢትዮ ቴሌኮም አገልግሎቶች",       desc: "SIM registration, plan upgrades, and telecom support in one visit." },
  { icon: "🏢", en: "Trade & Registration",          am: "ንግድና ምዝገባ",               desc: "Business registration, licensing, and trade-permit renewals." },
  { icon: "📬", en: "Ethio Post",                    am: "የኢትዮ ፖስታ",               desc: "Postal services, package pickup, and courier solutions." },
];

// ─── Delay helper for staggered animations ─────────────────────────────────────
function getDelay(index, multiplier = 0.1) {
  return index * multiplier;
}

// ─── Scroll-triggered animation helpers ───────────────────────────────────────
function useFadeIn(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} style={{ transition: `opacity .55s ease ${delay}s, transform .55s ease ${delay}s`, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(22px)", ...style }}>
      {children}
    </div>
  );
}

function SlideIn({ children, delay = 0 }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} style={{ transition: `opacity .55s ease ${delay}s, transform .55s ease ${delay}s`, opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-28px)" }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AboutPage() {
  const [lang, setLang]             = useState("both");
  const [openService, setOpenService] = useState(null);
  const [showTop, setShowTop]       = useState(false);
  const [scrollPct, setScrollPct]   = useState(0);
  const show = (w) => lang === "both" || lang === w;

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setScrollPct(Math.min(1, el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      setShowTop(el.scrollTop > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="about-page">
      {/* Scroll progress bar */}
      <div className="scroll-progress-bar">
        <div className="scroll-progress-fill" style={{ width: `${scrollPct}%` }} />
      </div>

      {/* Header/Navbar */}
      <header className="about-header">
        <div />

        <div className="lang-switcher">
          {[{ key: "both", label: "EN · አማ" }, { key: "en", label: "EN" }, { key: "am", label: "አማ" }].map(opt => (
            <button key={opt.key} onClick={() => setLang(opt.key)} className={`lang-btn ${lang === opt.key ? "active" : ""}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-ambient-glow" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="hero-particles" style={{ left: `${10 + i * 14}%`, top: `${20 + (i % 3) * 25}%`, animation: `floatBob ${4 + i * .5}s ease-in-out ${i * .3}s infinite` }} />
        ))}

        <div className="hero-overlay">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            {show("en") && <span>Modern Ethiopian Service for Organized Benefits</span>}
            {lang === "both" && <span style={{ opacity: 0.4 }}>·</span>}
            {show("am") && <span>ዘመናዊ የኢትዮጵያ ሥርዓታዊ አገልግሎት</span>}
          </div>

          <h1 className="hero-title">
            Hawassa <span className="hero-title-accent">MESOB</span> 
          </h1>

          {show("am") && <p className="hero-subtitle-am">ሀዋሳ መሶብ  </p>}
          <div className="hero-divider" />
          {show("en") && <p className="hero-description">Your one‑stop service center in the heart of Hawassa City — bringing government closer to every citizen.</p>}
          {show("am") && <p className="hero-description-am">በሀዋሳ ከተማ ውስጥ ፈጣን፣ ዘመናዊ እና ተደራሽ የአገልግሎት ማዕከል</p>}

          <button className="hero-btn">
            {show("en") && "Get Started"}{lang === "both" && " · "}{show("am") && "ጀምር"}
          </button>

          <div className="hero-scroll-indicator">
            <span className="hero-scroll-text">Scroll ↓</span>
          </div>
        </div>

        <div className="hero-bottom-bar" />
      </section>

      {/* WHO WE ARE */}
      <section className="about-section tone-default">
        <div className="about-section-content">
          <div className="about-section-header">
            <div className="about-section-eyebrow">
              {show("en") && <span>About us</span>}
              {lang === "both" && <span className="about-section-eyebrow-separator">·</span>}
              {show("am") && <span>ስለ እኛ</span>}
            </div>
            {show("en") && <h2 className="about-section-title">Who we are</h2>}
            {show("am") && <h2 className="about-section-title">እኛ ማን ነን?</h2>}
            <div className="about-section-title-underline" />
          </div>

          {show("en") && <FadeIn><p className="who-we-are-text">MESOB — <em>Modern Ethiopian Service for Organized Benefits</em> — is Ethiopia's flagship digital one‑stop service platform, launched by the federal government to modernize public service delivery for every citizen. Inspired by the traditional Ethiopian <em>mesob</em> basket that brings people together around a shared table, our center unites essential government institutions and services under one roof.</p></FadeIn>}
          {show("am") && <FadeIn delay={0.1}><p className="who-we-are-text-am">መሶብ (MESOB)- የተለያዩ የመንግስት ተቋማትና አገልግሎቶችን በአንድ ማዕከል በማሰባሰብ ለዜጎች ፈጣን፣ ቀላል እና ግልጽ አገልግሎት ለመስጠት የተቋቋመ ዘመናዊ የአገልግሎት ማዕከል ነው።</p></FadeIn>}
          {show("en") && <FadeIn delay={0.15}><p className="who-we-are-text">The <strong>Hawassa MESOB </strong> proudly serves the residents of Hawassa city . We are committed to eliminating bureaucratic barriers, reducing waiting times, and delivering transparent, dignified, and inclusive services to all.</p></FadeIn>}
          {show("am") && <FadeIn delay={0.2}><p className="who-we-are-text-am">ሀዋሳ መሶብ  ለመላው የሀዋሳ ከተማ ነዋሪዎች ተደራሽ፣ ቀልጣፋ እና ተገልጋይ ተኮር አገልግሎት ለመስጠት በቁርጠኝነት ይሰራል።</p></FadeIn>}

          {/* Stats grid */}
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <FadeIn key={s.en} delay={getDelay(i)}>
                <div className="stat-card">
                  <div className="stat-number">{s.number}</div>
                  {show("en") && <div className="stat-label-en">{s.en}</div>}
                  {show("am") && <div className="stat-label-am">{s.am}</div>}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="about-section tone-navy">
        <div className="about-section-content">
          <div className="about-section-header">
            <div className="about-section-eyebrow">
              {show("en") && <span>Our purpose</span>}
              {lang === "both" && <span className="about-section-eyebrow-separator">·</span>}
              {show("am") && <span>ዓላማችን</span>}
            </div>
            {show("en") && <h2 className="about-section-title">Mission & Vision</h2>}
            {show("am") && <h2 className="about-section-title">ተልዕኮና ራዕይ</h2>}
            <div className="about-section-title-underline" />
          </div>

          <div className="mission-vision-grid">
            {[
              { icon: "🎯", enTitle: "Mission", amTitle: "ተልዕኮ", en: "To deliver a seamless, efficient, and secure one‑stop service center where every resident of Hawassa City can access essential government services in a single location.", am: "የሐዋሳ ከተማ ነዋሪዎች አስፈላጊ የመንግሥት አገልግሎቶችን በአንድ ቦታ የሚያገኙበት የተቀላጠፈ፣ ቀልጣፋና አስተማማኝ አንድ‑ማቆሚያ የአገልግሎት ማዕከል መስጠት።" },
              { icon: "🔭", enTitle: "Vision", amTitle: "ራዕይ", en: "To become the model for integrated, transparent, and citizen-centered public services across Ethiopia — where every interaction with government is efficient, dignified, and accessible to all.", am: "በኢትዮጵያ ለተቀናጀ፣ ግልጽ እና ዜጋ ተኮር የሕዝብ አገልግሎት ሞዴል ለመሆን — ለሁሉም ሰው ቀልጣፋ፣ ክቡርና ተደራሽ አገልግሎት ማቅረብ።" },
            ].map((item, i) => (
              <FadeIn key={item.enTitle} delay={getDelay(i, 0.12)}>
                <div className={item.enTitle === "Mission" ? "mission-card" : "vision-card"}>
                  <div className={item.enTitle === "Mission" ? "mission-icon" : "vision-icon"}>{item.icon}</div>
                  {show("en") && <h3 className={item.enTitle === "Mission" ? "mission-title" : "vision-title"}>{item.enTitle}</h3>}
                  {show("am") && <p className={item.enTitle === "Mission" ? "mission-title-am" : "vision-title-am"}>{item.amTitle}</p>}
                  {show("en") && <p className={item.enTitle === "Mission" ? "mission-text" : "vision-text"}>{item.en}</p>}
                  {show("am") && <p className={item.enTitle === "Mission" ? "mission-text-am" : "vision-text-am"}>{item.am}</p>}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="about-section tone-default">
        <div className="about-section-content">
          <div className="about-section-header">
            <div className="about-section-eyebrow">
              {show("en") && <span>Our values</span>}
              {lang === "both" && <span className="about-section-eyebrow-separator">·</span>}
              {show("am") && <span>እሴቶቻችን</span>}
            </div>
            {show("en") && <h2 className="about-section-title">What we stand for</h2>}
            {show("am") && <h2 className="about-section-title">የምንመራባቸው እሴቶች</h2>}
            <div className="about-section-title-underline" />
          </div>

          <div className="values-grid">
            {VALUES.map((v, i) => (
              <FadeIn key={v.en_title} delay={getDelay(i, 0.1)}>
                <div className="value-card">
                  <div className="value-card-top-bar" />
                  <div className="value-icon">{v.icon}</div>
                  {show("en") && <h3 className="value-title">{v.en_title}</h3>}
                  {show("am") && <p className="value-title-am">{v.am_title}</p>}
                  {show("en") && <p className="value-text">{v.en_body}</p>}
                  {show("am") && <p className="value-text-am">{v.am_body}</p>}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORY */}
      <section className="about-section tone-cream">
        <div className="about-section-content">
          <div className="about-section-header">
            <div className="about-section-eyebrow">
              {show("en") && <span>Our journey</span>}
              {lang === "both" && <span className="about-section-eyebrow-separator">·</span>}
              {show("am") && <span>የእድገታችን ጉዞ</span>}
            </div>
            {show("en") && <h2 className="about-section-title">How MESOB came to Hawassa</h2>}
            {show("am") && <h2 className="about-section-title">መሶብ ወደ ሀዋሳ እንዴት መጣ?</h2>}
            <div className="about-section-title-underline" />
          </div>

          <div className="history-timeline">
            {HISTORY.map((h, i) => (
              <SlideIn key={h.year} delay={getDelay(i, 0.15)}>
                <div className="history-item">
                  <div className="history-dot" style={{ animation: `pulse ${2 + i * 0.4}s ease-in-out ${i * 0.4}s infinite` }} />
                  <div className="history-year">{h.year}</div>
                  {show("en") && <p className="history-text">{h.en}</p>}
                  {show("am") && <p className="history-text-am">{h.am}</p>}
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* NAME MEANING */}
      <section className="about-section tone-default">
        <div className="about-section-content">
          <div className="about-section-header">
            <div className="about-section-eyebrow">
              {show("en") && <span>The name 'Mesob'</span>}
              {lang === "both" && <span className="about-section-eyebrow-separator">·</span>}
              {show("am") && <span>የ"መሶብ" ትርጉም</span>}
            </div>
            {show("en") && <h2 className="about-section-title">Built on a tradition of unity</h2>}
            {show("am") && <h2 className="about-section-title">በአንድነት ባህል ላይ የተገነባ</h2>}
            <div className="about-section-title-underline" />
          </div>

          <div className="name-meaning-grid">
            <FadeIn>
              {show("en") && <p className="name-meaning-text">The name <strong>MESOB</strong> is inspired by the traditional Ethiopian <em>mesob</em> — a beautifully woven, round basket‑table used to serve food and bring people together. In Ethiopian culture, the mesob symbolizes <strong>unity</strong>, <strong>sharing</strong>, <strong>hospitality</strong>, and <strong>community</strong>.</p>}
              {show("am") && <p className="name-meaning-text-am">"መሶብ" የሚለው ስም ምግብ ለማቅረብና ቤተሰብን ወይም እንግዶችን በአንድ ማዕድ ዙሪያ ለማሰባሰብ የሚያገለግለውን ባህላዊ የኢትዮጵያ መሶብ ይወክላል። መሶብ አንድነትን፣ መካፈልን፣ እንግዳ ተቀባይነትን እና ማህበረሰባዊ ትስስርን ያመለክታል።</p>}
            </FadeIn>
            <FadeIn delay={0.1}>
              {show("en") && <p className="name-meaning-text">Similarly, MESOB Hawassa brings multiple government institutions and essential services together in one place — just as a traditional mesob gathers people around a single shared table. Our centre reflects <em>integration, accessibility, cooperation</em>, and a citizen‑centred approach to public service.</p>}
              {show("am") && <p className="name-meaning-text-am">ሀዋሳ መሶብም እንደዚሁ የተለያዩ ተቋማትንና አገልግሎቶችን በአንድ ቦታ በማሰባሰብ ለዜጎች ቀላል፣ ተደራሽ እና የተቀናጀ አገልግሎት ያቀርባል።</p>}
            </FadeIn>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn>
            <div className="services-header">
              {show("en") && <span>What we offer</span>}
              {lang === "both" && <span className="services-header-separator">·</span>}
              {show("am") && <span>የምናቀርበው</span>}
            </div>
            <h2 className="services-title">
              {show("en") && "Services at Hawassa MESOB "}
              {lang === "both" && <span style={{ opacity: 0.5 }}> · </span>}
              {show("am") && "በሐዋሳ መሶብ ያሉ አገልግሎቶች"}
            </h2>
            {show("en") && <p className="services-description">All under one roof — no more visiting multiple offices across the city.</p>}
            {show("am") && <p className="services-description-am">ሁሉም አገልግሎቶች በአንድ ማዕከል — ከቢሮ ወደ ቢሮ መዘዋወር ሳያስፈልግ።</p>}
          </FadeIn>

          <div className="services-list">
            {SERVICES.map((s, i) => {
              const isOpen = openService === s.en;
              return (
                <FadeIn key={s.en} delay={getDelay(i, 0.05)}>
                  <div className={`service-card ${isOpen ? "open" : ""}`} onClick={() => setOpenService(isOpen ? null : s.en)}>
                    <div className="service-icon">{s.icon}</div>
                    {show("en") && <h3 className="service-title">{s.en}</h3>}
                    {show("am") && <p className="service-name-am">{s.am}</p>}
                    {isOpen && <p className="service-detail">{s.desc}</p>}
                    <div className="service-hint">{isOpen ? "Tap to close" : "Tap for details"}</div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          {show("en") && <h2 className="cta-title">Ready to access our services?</h2>}
          {show("am") && <p className="cta-title-am">አገልግሎቶቻችንን ለማግኘት ዝግጁ ነዎት?</p>}
          <p className="cta-subtitle">Visit the Hawassa MESOB or start online — your time matters.</p>
          <div className="cta-buttons">
            <button className="cta-btn-primary">
              {show("en") && "Visit Us"}{lang === "both" && " · "}{show("am") && "ጎብኙን"}
            </button>
            <button className="cta-btn-secondary">
              {show("en") && "Contact Us"}{lang === "both" && " · "}{show("am") && "ያግኙን"}
            </button>
          </div>
        </div>
        <div className="cta-bottom-bar" />
      </section>

      {/* FOOTER */}
      <footer className="about-footer">
        <p className="footer-primary">Hawassa MESOB — Part of the national MESOB One‑Stop Service Center network.</p>
        <p className="footer-secondary">ሀዋሳ መሶብ  — የሀገር አቀፍ የመሶብ ማዕከል አውታር አካል።</p>
        <p className="footer-copyright">&copy; {new Date().getFullYear()} All Rights Reserved — Mesob Center Hawassa</p>
        <p className="footer-copyright-am">&copy; {new Date().getFullYear()} መሶብ ማዕከል ሀዋሳ — ሁሉም መብቶች የተጠበቁ ናቸው</p>
      </footer>

      {/* Back-to-top button */}
      {showTop && (
        <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
      )}
    </div>
  );
}
