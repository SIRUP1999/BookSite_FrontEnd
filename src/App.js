import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";

// ─── API base — set REACT_APP_API_URL in your .env for production ──────────
const API = process.env.REACT_APP_API_URL || "http://localhost:4000";
const toApiError = (data, fallback = "Request failed") => data?.error || data?.message || fallback;
const safeJson = async (res) => { try { return await res.json(); } catch { return null; } };

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600;700&display=swap');`;

const COVER_PALETTES = [
  { bg: ["#120343", "#2a1050"], text: "#f5e6c8", accent: "#c9a84c" },
  { bg: ["#0d1f0d", "#1a3d1a"], text: "#f5e6c8", accent: "#a3c97a" },
  { bg: ["#1a0a00", "#3d1f00"], text: "#f5e6c8", accent: "#c9a84c" },
  { bg: ["#060d1a", "#0f2040"], text: "#ddeeff", accent: "#7aaeed" },
  { bg: ["#1a1a0a", "#3a3518"], text: "#f5f0d0", accent: "#d4c060" },
  { bg: ["#1a0010", "#400030"], text: "#ffe0f0", accent: "#d48ab0" },
  { bg: ["#0a1a1a", "#0f3030"], text: "#d0f0f5", accent: "#6ed4d4" },
  { bg: ["#18100a", "#3a2808"], text: "#f5e6c8", accent: "#d4a060" },
];
const COVER_SYMBOLS = ["✝", "☩", "✦", "⚜", "✧", "♱", "☽", "⛪"];
const GENRES = ["Divine Mystery", "Prophetic", "Vision & Encounter", "Revelation", "Biblical Study", "Testimony", "Prayer & Fasting"];

// ─── Session ID for wishlist (no login needed) ────────────────────────────
const getSessionId = () => {
  let sid = localStorage.getItem("_wl_sid");
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("_wl_sid", sid);
  }
  return sid;
};

// ─── Shared context — avoids prop-drilling into every component ───────────
const Ctx = createContext({});
const useCtx = () => useContext(Ctx);

// ─── Styles at MODULE level — never recreated on re-render ────────────────
const S = {
  app: { minHeight: "100vh", background: "#0b0810", color: "#ede0cc", fontFamily: "'EB Garamond', Georgia, serif" },
nav: { background: "#0b081088", backdropFilter: "blur(12px)", borderBottom: "1px solid #2a1e3a", padding: "10px 1.2rem", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 66, position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 8 },  logo: { fontFamily: "Cinzel, serif", fontSize: 19, fontWeight: 600, color: "#c9a84c", cursor: "pointer", letterSpacing: "0.08em" },
  logoSub: { fontSize: 9, letterSpacing: "0.22em", color: "#6a5a4a", textTransform: "uppercase", fontFamily: "Cinzel, serif", marginTop: 2 },
  navBtn: (active) => ({ background: active ? "#c9a84c18" : "transparent", color: active ? "#c9a84c" : "#9a8878", border: active ? "1px solid #c9a84c44" : "1px solid transparent", padding: "6px 14px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontFamily: "Cinzel, serif", letterSpacing: "0.06em", transition: "all 0.2s" }),
  hero: { background: "linear-gradient(180deg, #0b0810 0%, #160d2a 40%, #0b0810 100%)", padding: "60px 1.5rem 50px", textAlign: "center", position: "relative", overflow: "hidden" },
  heroEyebrow: { fontSize: 10, letterSpacing: "0.3em", color: "#c9a84c", textTransform: "uppercase", marginBottom: 18, fontFamily: "Cinzel, serif" },
  heroTitle: { fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(36px,7vw,60px)", fontWeight: 700, color: "#ede0cc", lineHeight: 1.1, marginBottom: 18 },
  heroSub: { fontSize: 17, color: "#7a6a5a", lineHeight: 1.9, maxWidth: 540, margin: "0 auto 40px", fontStyle: "italic" },
  primaryBtn: { background: "#c9a84c", color: "#0b0810", border: "none", padding: "12px 28px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "Cinzel, serif", letterSpacing: "0.08em", transition: "all 0.2s" },
  secondaryBtn: { background: "transparent", color: "#c9a84c", border: "1px solid #c9a84c66", padding: "11px 20px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontFamily: "Cinzel, serif", letterSpacing: "0.08em", transition: "all 0.2s" },
  dangerBtn: { background: "transparent", color: "#f87171", border: "1px solid #f8717144", padding: "7px 14px", borderRadius: 99, cursor: "pointer", fontSize: 11, fontFamily: "Cinzel, serif" },
  greenBtn: { background: "transparent", color: "#4ade80", border: "1px solid #4ade8044", padding: "7px 14px", borderRadius: 99, cursor: "pointer", fontSize: 11, fontFamily: "Cinzel, serif" },
  section: { padding: "60px 1.5rem" },
  sectionTitle: { fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 700, color: "#c9a84c", marginBottom: 4 },
  sectionSub: { fontSize: 11, color: "#6a5a4a", marginBottom: 36, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Cinzel, serif" },
  bookGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 28 },
  bookCard: { cursor: "pointer", transition: "transform 0.2s" },
  bookTitle: { fontFamily: "Cormorant Garamond, serif", fontSize: 14, fontWeight: 600, color: "#ede0cc", marginTop: 10, lineHeight: 1.4 },
  bookMeta: { fontSize: 11, color: "#6a5a4a", marginTop: 3, letterSpacing: "0.05em" },
  priceTag: (free) => ({ display: "inline-block", fontSize: 12, fontWeight: 600, color: free ? "#4ade80" : "#c9a84c", marginTop: 4, fontFamily: "Cinzel, serif" }),
  tag: (color) => ({ display: "inline-block", fontSize: 10, letterSpacing: "0.1em", padding: "2px 10px", borderRadius: 99, background: color + "22", color, border: `1px solid ${color}44`, fontFamily: "Cinzel, serif" }),
  input: { background: "#16101e", border: "1px solid #2a1e3a", color: "#ede0cc", padding: "10px 14px", borderRadius: 8, fontSize: 14, fontFamily: "'EB Garamond', serif", width: "100%", outline: "none", boxSizing: "border-box" },
  textarea: { background: "#16101e", border: "1px solid #2a1e3a", color: "#ede0cc", padding: "12px 14px", borderRadius: 8, fontSize: 15, fontFamily: "'EB Garamond', serif", width: "100%", outline: "none", resize: "vertical", lineHeight: 2, boxSizing: "border-box" },
  label: { fontSize: 11, color: "#6a5a4a", letterSpacing: "0.12em", marginBottom: 6, display: "block", textTransform: "uppercase", fontFamily: "Cinzel, serif" },
  card: { background: "#16101e", border: "1px solid #2a1e3a", borderRadius: 12, padding: "24px" },
  adminSidebar: { width: 220, background: "#0d0a14", borderRight: "1px solid #1e1428", minHeight: "calc(100vh - 66px)", padding: "24px 0", flexShrink: 0 },
  adminMenuItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 22px", cursor: "pointer", color: active ? "#c9a84c" : "#6a5a4a", background: active ? "#c9a84c11" : "transparent", borderLeft: active ? "2px solid #c9a84c" : "2px solid transparent", fontSize: 12, fontFamily: "Cinzel, serif", letterSpacing: "0.06em", transition: "all 0.15s" }),
  stat: { background: "#16101e", border: "1px solid #2a1e3a", borderRadius: 10, padding: "18px 20px" },
  badge: (color) => ({ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 99, background: color + "22", color, border: `1px solid ${color}44`, textTransform: "uppercase", fontFamily: "Cinzel, serif" }),
  tableRow: (i) => ({ display: "grid", padding: "12px 18px", borderTop: i > 0 ? "1px solid #1a1020" : "none", alignItems: "center", fontSize: 13, gap: 12 }),
};

// ═══════════════════════════════════════════════════════════════════════════
// ── SHARED UI ATOMS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function DecorativeLine() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "18px 0" }}>
      <div style={{ height: 1, width: 40, background: "#c9a84c44" }} />
      <div style={{ color: "#c9a84c55", fontSize: 14 }}>✦</div>
      <div style={{ height: 1, width: 40, background: "#c9a84c44" }} />
    </div>
  );
}

function BookCover({ book, size = "md" }) {
  const palette = COVER_PALETTES[(book.coverPalette || 0) % COVER_PALETTES.length];
  const symbol = COVER_SYMBOLS[(book.coverPattern || 0) % COVER_SYMBOLS.length];
  const sizes = { sm: { w: 90, h: 130 }, md: { w: 140, h: 200 }, lg: { w: 200, h: 290 } };
  const { w, h } = sizes[size] || sizes.md;
  const titleSize = size === "lg" ? 14 : size === "md" ? 11 : 8;
  const authorSize = size === "lg" ? 10 : size === "md" ? 8 : 6;
  if (book.coverImage) {
    return (
      <div style={{ width: w, height: h, borderRadius: 6, overflow: "hidden", flexShrink: 0, boxShadow: "4px 4px 20px rgba(0,0,0,0.6)" }}>
        <img src={book.coverImage} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: w, height: h, borderRadius: 6, flexShrink: 0, overflow: "hidden", background: `linear-gradient(160deg, ${palette.bg[0]}, ${palette.bg[1]})`, boxShadow: "4px 4px 24px rgba(0,0,0,0.7)", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: size === "lg" ? "18px 14px" : size === "md" ? "12px 10px" : "8px 7px", border: `1px solid ${palette.accent}55` }}>
      <div style={{ fontSize: size === "lg" ? 8 : 6, letterSpacing: "0.2em", color: palette.accent, textTransform: "uppercase", fontFamily: "Cinzel, serif" }}>{book.genre || "Revelation"}</div>
      <div style={{ textAlign: "center", color: palette.accent, fontSize: size === "lg" ? 36 : size === "md" ? 26 : 18, opacity: 0.18, fontFamily: "serif" }}>{symbol}</div>
      <div>
        <div style={{ fontFamily: "Cinzel, serif", fontWeight: 600, fontSize: titleSize, color: palette.text, lineHeight: 1.35, marginBottom: 5 }}>{book.title}</div>
        <div style={{ width: size === "lg" ? 28 : 20, height: 1, background: palette.accent, marginBottom: 5, opacity: 0.7 }} />
        <div style={{ fontSize: authorSize, color: palette.accent, letterSpacing: "0.06em", fontFamily: "Cinzel, serif" }}>{book.author}</div>
      </div>
      {book.price === 0 && (
        <div style={{ position: "absolute", top: size === "sm" ? 5 : 8, right: size === "sm" ? 5 : 8, background: "#22c55e", color: "#fff", fontSize: size === "sm" ? 6 : 7, fontWeight: 700, padding: "2px 6px", borderRadius: 99, fontFamily: "Cinzel, serif" }}>FREE</div>
      )}
    </div>
  );
}

function Notification() {
  const { notification } = useCtx();
  if (!notification) return null;
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: notification.type === "success" ? "#14532d" : "#7f1d1d", color: "#fff", padding: "12px 22px", borderRadius: 8, fontSize: 13, zIndex: 9999, fontFamily: "Cinzel, serif", letterSpacing: "0.05em", border: `1px solid ${notification.type === "success" ? "#22c55e55" : "#ef444455"}`, maxWidth: 340 }}>
      {notification.type === "success" ? "✦" : "✕"} {notification.msg}
    </div>
  );
}

function PaymentVerifyingOverlay() {
  const { paymentVerifying } = useCtx();
  if (!paymentVerifying) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0b0810cc", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#c9a84c", marginBottom: 16, animation: "pulse 1.5s infinite" }}>✦</div>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 14, color: "#ede0cc", letterSpacing: "0.1em" }}>Verifying your payment…</div>
        <div style={{ fontSize: 12, color: "#5a4a6a", marginTop: 8, fontStyle: "italic" }}>Please wait a moment</div>
      </div>
    </div>
  );
}

function AdminLogin() {
  const { adminPwd, setAdminPwd, handleAdminLogin, setShowAdminLogin, adminLoginLoading } = useCtx();
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0b081099", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
<div style={{ ...S.card, width: "min(340px, calc(100% - 32px))", textAlign: "center" }}>        <div style={{ fontFamily: "Cinzel, serif", fontSize: 18, color: "#c9a84c", marginBottom: 6 }}>Admin Access</div>
        <div style={{ fontSize: 13, color: "#5a4a6a", marginBottom: 20 }}>Enter password to continue</div>
        <input autoFocus type="password" disabled={adminLoginLoading} style={{ ...S.input, marginBottom: 12, textAlign: "center" }} placeholder="Password" value={adminPwd} onChange={e => setAdminPwd(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAdminLogin(); }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.primaryBtn, opacity: adminLoginLoading ? 0.6 : 1 }} onClick={handleAdminLogin} disabled={adminLoginLoading}>{adminLoginLoading ? "Entering…" : "Enter"}</button>
          <button style={S.secondaryBtn} onClick={() => setShowAdminLogin(false)} disabled={adminLoginLoading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Nav() {
  const { view, setView, isAdmin, wishlist, handleLogoTap } = useCtx();
  return (
    <nav style={S.nav}>
      <div onClick={handleLogoTap} style={{ cursor: "pointer" }}>
        <div style={S.logo}>The Open Scroll</div>
        <div style={S.logoSub}>by Abednego Appiah Mensah</div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {["home", "catalog", "contact"].map(v => (
          <button key={v} style={S.navBtn(view === v)} onClick={() => setView(v)}>
            {v === "home" ? "Home" : v === "catalog" ? "Library" : "Contact"}
          </button>
        ))}
        <button style={{ ...S.navBtn(view === "wishlist"), position: "relative" }} onClick={() => setView("wishlist")}>
          ♡ Wishlist
          {wishlist.length > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, background: "#c9a84c", color: "#0b0810", fontSize: 8, fontWeight: 700, minWidth: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
              {wishlist.length}
            </span>
          )}
        </button>
        {isAdmin && <button style={{ ...S.navBtn(view === "admin"), color: "#c9a84c" }} onClick={() => setView("admin")}>⚙ Admin</button>}
      </div>
    </nav>
  );
}

function Footer() {
  return (
<footer style={{ borderTop: "1px solid #1a1020", padding: "36px 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, color: "#c9a84c", letterSpacing: "0.08em" }}>The Open Scroll</div>
        <div style={{ fontSize: 11, color: "#3a2a4a", marginTop: 4, fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>by Abednego Appiah Mensah</div>
      </div>
      <div style={{ fontSize: 12, color: "#3a2a4a", fontStyle: "italic", fontFamily: "'EB Garamond', serif" }}>"What I tell you in darkness, speak in the light."</div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PUBLIC PAGES ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function Home() {
  const { publishedBooks, setView, setFilterPrice, showNotif } = useCtx();
  const [newsEmail, setNewsEmail] = useState("");
  const [newsName, setNewsName] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);
  const free = publishedBooks.filter(b => b.price === 0);
  const { openBook } = useCtx();

  const handleNewsletterSignup = async () => {
    if (!newsEmail.trim()) { showNotif("Email required", "error"); return; }
    setNewsLoading(true);
    try {
      const res = await fetch(`${API}/api/newsletter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newsEmail, name: newsName }) });
      const data = await res.json();
      if (!res.ok) { showNotif(res.status === 409 ? "Already subscribed" : data.error || "Signup failed", "error"); return; }
      setNewsEmail(""); setNewsName("");
      showNotif("✦ Welcome! Check your email.");
    } catch { showNotif("Signup failed", "error"); }
    finally { setNewsLoading(false); }
  };

  return (
    <div>
      {/* Hero */}
      <div style={S.hero}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(#c9a84c 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div style={{ position: "relative" }}>
          <div style={S.heroEyebrow}>✦ Divine Mysteries Unveiled ✦</div>
          <h1 style={S.heroTitle}>Words Spoken<br /><em style={{ color: "#c9a84c" }}>from Heaven</em><br />Written for the Earth</h1>
          <p style={S.heroSub}>Prophetic revelations, divine encounters, and mysteries God has unveiled — offered freely and as premium works to the Body of Christ.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={S.primaryBtn} onClick={() => setView("catalog")}>Enter the Library</button>
            <button style={S.secondaryBtn} onClick={() => { setFilterPrice("Free"); setView("catalog"); }}>Free Books</button>
          </div>
          <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
            {[
              [String(publishedBooks.length), "Books Published"],
              [publishedBooks.reduce((s, b) => s + (b.downloads || 0), 0).toLocaleString(), "Downloads"],
              [String(free.length) + " Free", "Available Free"],
            ].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 34, fontWeight: 700, color: "#c9a84c" }}>{n}</div>
                <div style={{ fontSize: 9, color: "#4a3a5a", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "Cinzel, serif", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div style={{ ...S.section, borderTop: "1px solid #1a1020", paddingLeft: 0, paddingRight: 0 }}>
<div style={{ paddingLeft: "1.5rem", marginBottom: 32 }}>          <div style={S.sectionTitle}>Featured Revelations</div>
          <div style={{ ...S.sectionSub, marginBottom: 0 }}>Handpicked Works</div>
        </div>
        {publishedBooks.length === 0 ? (
          <div style={{ textAlign: "center", color: "#4a3a5a", padding: "40px 3rem", fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontStyle: "italic" }}>No books published yet.</div>
        ) : (
          <div className="carousel-wrap" style={{ padding: "16px 0 28px" }}>
            <div className="carousel-track">
              {[...publishedBooks, ...publishedBooks].map((b, i) => (
                <div key={i} className="carousel-card" onClick={() => openBook(b)}>
                  <BookCover book={b} size="md" />
                  <div style={{ ...S.bookTitle, maxWidth: 140 }}>{b.title}</div>
                  <div style={S.bookMeta}>{b.genre}</div>
                  <div style={S.priceTag(b.price === 0)}>{b.price === 0 ? "Free" : `GH₵ ${b.price.toFixed(2)}`}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Free books */}
      {free.length > 0 && (
        <div style={{ ...S.section, background: "#0d0a14", borderTop: "1px solid #1a1020", borderBottom: "1px solid #1a1020" }}>
          <div style={S.sectionTitle}>Free to the Body of Christ</div>
          <div style={S.sectionSub}>No payment required — freely given</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {free.map(b => (
              <div key={b.id} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "#16101e", border: "1px solid #2a1e3a", borderRadius: 12, padding: 18, cursor: "pointer", flex: "1 1 290px" }} onClick={() => openBook(b)}>
                <BookCover book={b} size="sm" />
                <div>
                  <div style={{ ...S.tag("#4ade80"), marginBottom: 8 }}>FREE</div>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, fontWeight: 600, color: "#ede0cc", marginBottom: 4, lineHeight: 1.3 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: "#5a4a6a", marginBottom: 8, fontFamily: "Cinzel, serif" }}>{b.pages} pages · {b.genre}</div>
                  <div style={{ fontSize: 13, color: "#8a7870", lineHeight: 1.7, fontStyle: "italic" }}>{(b.description || "").slice(0, 100)}…</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote */}
      <div style={{ ...S.section, textAlign: "center", borderTop: "1px solid #1a1020" }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, fontStyle: "italic", color: "#7a6a5a", maxWidth: 600, margin: "0 auto 20px", lineHeight: 1.7 }}>
          "What I tell you in the darkness, speak in the light — and what you hear whispered in your ear, proclaim from the rooftops."
        </div>
        <div style={{ fontSize: 12, color: "#4a3a5a", letterSpacing: "0.15em", fontFamily: "Cinzel, serif" }}>MATTHEW 10:27</div>
        <DecorativeLine />
        <div style={{ fontSize: 14, color: "#6a5a4a", maxWidth: 500, margin: "0 auto", lineHeight: 1.9 }}>
          Abednego Appiah Mensah is an author and prophetic voice whose writings emerge from personal divine revelation — encounters with God, angelic visitations, and mysteries unveiled through prayer and scripture.
        </div>
      </div>

      {/* Newsletter */}
      <div style={{ ...S.section, background: "#0d0a14", borderTop: "1px solid #1a1020", borderBottom: "1px solid #1a1020" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <div style={S.sectionTitle}>Stay Connected</div>
          <div style={S.sectionSub}>New revelations, updates & exclusive insights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={S.input} placeholder="Your name (optional)" value={newsName} onChange={e => setNewsName(e.target.value)} />
            <input style={S.input} type="email" placeholder="Your email address" value={newsEmail} onChange={e => setNewsEmail(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleNewsletterSignup(); }} />
            <button style={{ ...S.primaryBtn, opacity: newsLoading ? 0.6 : 1 }} onClick={handleNewsletterSignup} disabled={newsLoading}>
              {newsLoading ? "Subscribing…" : "✦ Subscribe to Newsletter"}
            </button>
            <div style={{ fontSize: 11, color: "#4a3a5a", fontStyle: "italic" }}>We respect your privacy. Unsubscribe anytime.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Catalog() {
  const { filteredBooks, searchQuery, setSearchQuery, filterGenre, setFilterGenre, filterPrice, setFilterPrice, openBook } = useCtx();
  return (
    <div style={S.section}>
      <div style={{ marginBottom: 32 }}>
        <div style={S.sectionTitle}>The Library</div>
        <div style={S.sectionSub}>{filteredBooks.length} Works Available</div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <input style={{ ...S.input, flex: "1 1 200px", maxWidth: 300 }} placeholder="Search books…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <select style={{ ...S.input, width: "auto" }} value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
          <option>All</option>
          {GENRES.map(g => <option key={g}>{g}</option>)}
        </select>
        <select style={{ ...S.input, width: "auto" }} value={filterPrice} onChange={e => setFilterPrice(e.target.value)}>
          <option>All</option><option>Free</option><option>Paid</option>
        </select>
      </div>
      {filteredBooks.length === 0
        ? <div style={{ textAlign: "center", color: "#4a3a5a", padding: 60, fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontStyle: "italic" }}>No books found. Try adjusting your search.</div>
        : <div style={S.bookGrid}>
          {filteredBooks.map(b => (
            <div key={b.id} style={S.bookCard} onClick={() => openBook(b)}>
              <BookCover book={b} size="md" />
              <div style={S.bookTitle}>{b.title}</div>
              <div style={S.bookMeta}>{b.genre} · {b.pages}p</div>
              <div style={S.priceTag(b.price === 0)}>{b.price === 0 ? "Free" : `GH₵ ${b.price.toFixed(2)}`}</div>
            </div>
          ))}
        </div>}
    </div>
  );
}

function Contact() {
  const { showNotif } = useCtx();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) { showNotif("All fields are required", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/inquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { showNotif(data.error || "Failed to send message", "error"); return; }
      setForm({ name: "", email: "", subject: "", message: "" });
      showNotif("✦ Message sent! We'll respond soon.");
    } catch { showNotif("Error sending message", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.section}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={S.sectionTitle}>Get in Touch</div>
        <div style={S.sectionSub}>We'd love to hear from you</div>
        <div style={S.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[["Your Name *", "name", "text", "Full name"], ["Email Address *", "email", "email", "your@email.com"], ["Subject *", "subject", "text", "What is this about?"]].map(([lbl, key, type, ph]) => (
              <div key={key}>
                <label style={S.label}>{lbl}</label>
                <input style={S.input} type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label style={S.label}>Message *</label>
              <textarea style={{ ...S.textarea, height: 140 }} placeholder="Your message here…" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            </div>
            <button style={{ ...S.primaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? "Sending…" : "✦ Send Message"}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 40, textAlign: "center", padding: 32, background: "#16101e", borderRadius: 12, border: "1px solid #2a1e3a" }}>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#c9a84c", marginBottom: 12 }}>Other Ways to Connect</div>
          <div style={{ fontSize: 13, color: "#8a7870", lineHeight: 1.9 }}>
<a href="mailto:albertofori009@gmail.com" style={{ color: "#c9a84c", textDecoration: "none" }}>albertofori009@gmail.com</a>          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BOOK DETAIL ──────────────────────────────────────────────────────────
function BookDetail({ book }) {
  const { purchasedBooks, wishlist, addToWishlist, removeFromWishlist, setView, showNotif } = useCtx();
const hasPurchased = purchasedBooks.includes(String(book.id)); 
 const inWishlist = wishlist.some(w => String(w.id) === String(book.id));
  const [paying, setPaying] = useState(false);
  const [payEmail, setPayEmail] = useState("");
  const [payName, setPayName] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/books/${book.id}/reviews`)
      .then(r => r.json()).then(d => setReviews(Array.isArray(d) ? d : [])).catch(() => {});
  }, [book.id]);

  // Real Paystack initialization — redirects to Paystack hosted page
  const handleInitPayment = async () => {
    if (!payEmail.trim() || !payName.trim()) { showNotif("Name and email required", "error"); return; }
    setPayLoading(true);
    try {
      const res = await fetch(`${API}/api/payment/initialize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payEmail, name: payName, bookId: book.id, amount: book.price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initialization failed");
      localStorage.setItem("pending_payment", JSON.stringify({ bookId: book.id }));
      window.location.href = data.data.authorization_url;
    } catch (err) {
      showNotif(err.message || "Payment failed", "error");
      setPayLoading(false);
    }
  };

  // Real PDF download from backend
  const handleFreeDownload = async () => {
    showNotif("Generating PDF…");
    try {
      const res = await fetch(`${API}/api/books/${book.id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${book.title.replace(/\s+/g, "_")}_OpenScroll.pdf`; a.click();
      URL.revokeObjectURL(url);
      showNotif("✦ PDF downloaded! God bless your reading.");
    } catch (err) { showNotif(err.message || "Download failed", "error"); }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) { showNotif("Name and comment required", "error"); return; }
    setReviewLoading(true);
    try {
      const res = await fetch(`${API}/api/books/${book.id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reviewForm) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed"));
      setReviewForm({ name: "", rating: 5, comment: "" });
      setShowReviewForm(false);
      setReviews(prev => [...prev, data]);
      showNotif("Review submitted ✦");
    } catch (err) { showNotif(err.message || "Review failed", "error"); }
    finally { setReviewLoading(false); }
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "48px 2rem" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
        <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={() => setView("catalog")}>← Back</button>
        <button
          style={{ ...S.secondaryBtn, fontSize: 11, color: inWishlist ? "#f87171" : "#c9a84c", borderColor: inWishlist ? "#f8717144" : "#c9a84c66" }}
          onClick={() => inWishlist ? removeFromWishlist(book.id) : addToWishlist(book.id)}
        >
          {inWishlist ? "♥ In Wishlist" : "♡ Add to Wishlist"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 44, flexWrap: "wrap" }}>
        <BookCover book={book} size="lg" />
<div style={{ flex: 1, minWidth: "min(260px, 100%)" }}>          <div style={{ ...S.tag("#c9a84c"), marginBottom: 14 }}>{book.genre}</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 38, fontWeight: 700, color: "#ede0cc", margin: "0 0 8px", lineHeight: 1.15 }}>{book.title}</h1>
          <div style={{ fontSize: 14, color: "#8a7870", marginBottom: 6, fontFamily: "Cinzel, serif", letterSpacing: "0.06em" }}>by {book.author}</div>
          {avgRating && (
            <div style={{ fontSize: 13, color: "#c9a84c", marginBottom: 6 }}>
              {"★".repeat(Math.round(Number(avgRating)))}{"☆".repeat(5 - Math.round(Number(avgRating)))} {avgRating} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
            </div>
          )}
          <DecorativeLine />
          <div style={{ fontSize: 15, color: "#7a6a5a", lineHeight: 1.95, marginBottom: 24, maxWidth: 500, fontStyle: "italic" }}>{book.description}</div>
          <div style={{ display: "flex", gap: 20, marginBottom: 24, fontSize: 12, color: "#5a4a6a", fontFamily: "Cinzel, serif" }}>
            <span>📄 {book.pages} pages</span>
            <span>📥 {book.downloads} downloads</span>
            <span>👁 {book.views} views</span>
          </div>

          {book.price === 0 ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, color: "#4ade80", fontStyle: "italic" }}>Free Gift</span>
              <button style={S.primaryBtn} onClick={() => { setView("reader"); window.scrollTo(0, 0); }}>Read Online</button>
              <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={handleFreeDownload}>↓ Download PDF</button>
            </div>
          ) : hasPurchased ? (
            <div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <span style={S.badge("#4ade80")}>✦ Purchased</span>
                <button style={S.primaryBtn} onClick={() => { setView("reader"); window.scrollTo(0, 0); }}>Read Online</button>
              </div>
              <div style={{ fontSize: 12, color: "#5a4a6a", fontStyle: "italic" }}>The full PDF was emailed to you after purchase.</div>
            </div>
          ) : paying ? (
            <div style={{ ...S.card, border: "1px solid #c9a84c44" }}>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "#ede0cc", marginBottom: 4 }}>Complete Your Order</div>
              <div style={{ fontSize: 13, color: "#c9a84c", marginBottom: 16, fontFamily: "Cinzel, serif" }}>GH₵ {book.price.toFixed(2)}</div>
              <input style={{ ...S.input, marginBottom: 10 }} placeholder="Full name" value={payName} onChange={e => setPayName(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 16 }} type="email" placeholder="Email — PDF will be sent here" value={payEmail} onChange={e => setPayEmail(e.target.value)} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ ...S.primaryBtn, opacity: payLoading ? 0.6 : 1 }} onClick={handleInitPayment} disabled={payLoading}>
                  {payLoading ? "Redirecting to Paystack…" : "Pay with Paystack ✦"}
                </button>
                <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={() => setPaying(false)}>Cancel</button>
              </div>
              <div style={{ fontSize: 11, color: "#3a2a4a", marginTop: 12 }}>Secured by Paystack. Book PDF emailed after payment.</div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, color: "#c9a84c" }}>GH₵ {book.price.toFixed(2)}</span>
              <button style={S.primaryBtn} onClick={() => setPaying(true)}>Buy & Get PDF</button>
              <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={() => { setView("reader"); window.scrollTo(0, 0); }}>Preview</button>
            </div>
          )}
        </div>
      </div>

      {/* Excerpt */}
      <div style={{ marginTop: 52, borderTop: "1px solid #1a1020", paddingTop: 36 }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#c9a84c", marginBottom: 20 }}>An Excerpt</div>
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#8a7870", lineHeight: 2.1, fontStyle: "italic", maxWidth: 620, borderLeft: "2px solid #c9a84c44", paddingLeft: 20 }}>
          "{(book.content || "").slice(0, 400)}…"
        </div>
      </div>

      {/* Reviews */}
      <div style={{ marginTop: 52, borderTop: "1px solid #1a1020", paddingTop: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#c9a84c" }}>
            Readers' Testimonies {reviews.length > 0 && <span style={{ fontSize: 14, color: "#5a4a6a" }}>({reviews.length})</span>}
          </div>
          <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={() => setShowReviewForm(v => !v)}>
            {showReviewForm ? "Cancel" : "+ Share Your Experience"}
          </button>
        </div>
        {showReviewForm && (
          <div style={{ ...S.card, marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={S.input} placeholder="Your name" value={reviewForm.name} onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label style={S.label}>Rating</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 26, color: n <= reviewForm.rating ? "#c9a84c" : "#2a1e3a", padding: "2px 1px" }} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>{n <= reviewForm.rating ? "★" : "☆"}</button>
                  ))}
                </div>
              </div>
              <textarea style={{ ...S.textarea, height: 100 }} placeholder="Share how this book ministered to you…" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
              <button style={{ ...S.primaryBtn, opacity: reviewLoading ? 0.6 : 1 }} onClick={handleSubmitReview} disabled={reviewLoading}>
                {reviewLoading ? "Submitting…" : "Submit Review ✦"}
              </button>
            </div>
          </div>
        )}
        {reviews.length === 0
          ? <div style={{ color: "#4a3a5a", fontStyle: "italic", fontSize: 14 }}>No reviews yet. Be the first to share your experience.</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ ...S.card, borderColor: "#1e1830" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontFamily: "Cinzel, serif", fontSize: 12, color: "#c9a84c" }}>{r.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#c9a84c", fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span style={{ fontSize: 11, color: "#3a2a4a" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "#8a7870", lineHeight: 1.8, fontStyle: "italic" }}>{r.comment}</div>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}

// ─── READER — book-like layout ────────────────────────────────────────────
function Reader({ book }) {
  const { purchasedBooks, setView } = useCtx();
  const hasPurchased = purchasedBooks.includes(String(book.id));
  const showFull = book.price === 0 || hasPurchased;
  const lines = (book.content || "").split("\n");
  const display = showFull ? lines : lines.slice(0, 22);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setProgress(Math.min(100, Math.round(pct)));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#0e0b14", minHeight: "100vh" }}>
      {/* Reading progress bar */}
      <div style={{ position: "fixed", top: 66, left: 0, right: 0, height: 2, background: "#1a1020", zIndex: 50 }}>
        <div style={{ height: "100%", background: "#c9a84c", width: `${progress}%`, transition: "width 0.1s" }} />
      </div>

<div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 1.2rem 80px" }}>        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
          <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={() => { setView("book-detail"); window.scrollTo(0, 0); }}>← Back</button>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {showFull && <div style={{ fontSize: 11, color: "#3a2a4a", fontFamily: "Cinzel, serif", letterSpacing: "0.12em" }}>{progress}%</div>}
            <div style={{ fontSize: 11, color: "#3a2a4a", fontFamily: "Cinzel, serif", letterSpacing: "0.12em" }}>{book.pages} PAGES</div>
          </div>
        </div>

        {/* Book header */}
        <div style={{ textAlign: "center", marginBottom: 56, paddingBottom: 40, borderBottom: "1px solid #1a1020" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#5a4a6a", textTransform: "uppercase", marginBottom: 12, fontFamily: "Cinzel, serif" }}>{book.genre}</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 40, fontWeight: 700, color: "#ede0cc", marginBottom: 10, lineHeight: 1.2 }}>{book.title}</h1>
          <div style={{ fontSize: 14, color: "#6a5a4a", fontStyle: "italic", fontFamily: "'EB Garamond', serif", marginBottom: 20 }}>by {book.author}</div>
          <BookCover book={book} size="sm" />
        </div>

        {/* Content */}
<div style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6, color: "#c8b89a", letterSpacing: "0.02em", maxWidth: 640, margin: "0 auto" }}>          {display.map((l, i) => {
            if (l.trim() === "") return <div key={i} style={{ height: 22 }} />;
            if (l.match(/^(Chapter|Foreword|Prologue|Preface|Part\s|Opening|Introduction|A Word|Appendix|\d+\.)/i))
              return (
                <div key={i} style={{ margin: "44px 0 22px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#c9a84c", fontFamily: "Cinzel, serif", textTransform: "uppercase" }}>{l}</div>
                  <div style={{ height: 1, background: "#c9a84c33", marginTop: 14 }} />
                </div>
              );
return <p key={i} style={{ margin: "0 0 0.4em", textIndent: "2em" }}>{l}</p>;        })}
        </div>

        {/* Paywall */}
        {!showFull && book.price > 0 && (
          <div style={{ marginTop: 60, position: "relative" }}>
            <div style={{ height: 120, background: "linear-gradient(transparent, #0e0b14)", marginBottom: -60, position: "relative", zIndex: 1 }} />
            <div style={{ textAlign: "center", padding: "48px 36px", background: "#16101e", borderRadius: 12, border: "1px solid #2a1e3a" }}>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 36, color: "#c9a84c", marginBottom: 12 }}>✦</div>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#ede0cc", marginBottom: 8 }}>The revelation continues…</div>
              <div style={{ fontSize: 13, color: "#5a4a6a", marginBottom: 28, fontFamily: "Cinzel, serif" }}>Purchase to receive the full {book.pages} pages as a beautiful PDF</div>
              <button style={S.primaryBtn} onClick={() => { setView("book-detail"); window.scrollTo(0, 0); }}>
                Get the Full Book — GH₵ {book.price.toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────
function WishlistView() {
  const { wishlist, removeFromWishlist, openBook, setView } = useCtx();
  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>Your Wishlist</div>
      <div style={{ ...S.sectionSub, marginBottom: 32 }}>{wishlist.length} saved book{wishlist.length !== 1 ? "s" : ""}</div>
      {wishlist.length === 0 ? (
        <div style={{ textAlign: "center", color: "#4a3a5a", padding: 60, fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontStyle: "italic" }}>
          Your wishlist is empty.<br />
          <button style={{ ...S.primaryBtn, marginTop: 24 }} onClick={() => setView("catalog")}>Browse Library</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {wishlist.map(b => (
            <div key={b.id} style={{ ...S.card, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <BookCover book={b} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "#ede0cc", marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "#5a4a6a", fontFamily: "Cinzel, serif" }}>{b.genre} · {b.pages}p</div>
                <div style={S.priceTag(b.price === 0)}>{b.price === 0 ? "Free" : `GH₵ ${b.price.toFixed(2)}`}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.primaryBtn} onClick={() => openBook(b)}>View Book</button>
                <button style={S.dangerBtn} onClick={() => removeFromWishlist(b.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UNSUBSCRIBE — handles /unsubscribe?email=... links from newsletter ───
function UnsubscribeView() {
  const { unsubEmail, setView, showNotif } = useCtx();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/newsletter/unsubscribe?email=${encodeURIComponent(unsubEmail)}`, { method: "DELETE" });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed"));
      setDone(true);
    } catch (err) { showNotif(err.message || "Unsubscribe failed", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ ...S.section, maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
      {done ? (
        <>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, color: "#c9a84c", marginBottom: 16 }}>You've Been Unsubscribed</div>
          <div style={{ color: "#8a7870", fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}><strong style={{ color: "#c9a84c" }}>{unsubEmail}</strong> has been removed from the newsletter.</div>
          <button style={S.secondaryBtn} onClick={() => { setView("home"); window.history.replaceState({}, "", "/"); }}>Return Home</button>
        </>
      ) : (
        <>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, color: "#ede0cc", marginBottom: 16 }}>Unsubscribe</div>
          <div style={{ color: "#8a7870", fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
            Remove <strong style={{ color: "#c9a84c" }}>{unsubEmail}</strong> from The Open Scroll newsletter?
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button style={{ ...S.dangerBtn, fontSize: 13, padding: "11px 24px" }} onClick={handleUnsubscribe} disabled={loading}>{loading ? "Processing…" : "Yes, Unsubscribe Me"}</button>
            <button style={S.secondaryBtn} onClick={() => setView("home")}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── ADMIN PANELS ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function AdminDashboard() {
  const { books, adminToken, setAdminView, setEditingBook, showNotif, fetchAdminBooks } = useCtx();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/admin/statistics`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(async (r) => {
        const data = await safeJson(r);
        if (!r.ok) throw new Error(toApiError(data, "Failed to load stats"));
        setStats(data);
      }).catch((err) => showNotif(err.message || "Failed to load stats", "error"));
  }, [adminToken, showNotif]);

  const togglePublish = async (b) => {
    try {
      const res = await fetch(`${API}/api/admin/books/${b.id}/publish`, { method: "PATCH", headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed"));
      fetchAdminBooks();
      showNotif(b.published ? "Book unpublished" : "Book published! ✦");
    } catch (err) { showNotif(err.message || "Error toggling publish", "error"); }
  };

  const deleteBook = async (b) => {
    if (!window.confirm(`Delete "${b.title}"? Cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/api/admin/books/${b.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed"));
      fetchAdminBooks(); showNotif("Book deleted.");
    } catch (err) { showNotif(err.message || "Error deleting book", "error"); }
  };

  return (
<div style={{ padding: "24px 16px" }}>      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#ede0cc", marginBottom: 4 }}>Dashboard</div>
      <div style={{ fontSize: 12, color: "#5a4a6a", marginBottom: 32, fontFamily: "Cinzel, serif" }}>Welcome, Abednego ✦</div>

      {stats && (
        <>
          {stats.undeliveredOrders > 0 && (
            <div style={{ background: "#7f1d1d22", border: "1px solid #f8717144", borderRadius: 8, padding: "12px 18px", marginBottom: 24, color: "#f87171", fontSize: 13, fontFamily: "Cinzel, serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⚠ {stats.undeliveredOrders} order{stats.undeliveredOrders > 1 ? "s" : ""} failed email delivery</span>
              <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => setAdminView("orders")}>View & Resend →</span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 40 }}>
            {[
              ["GH₵ " + stats.totalRevenue, "Revenue", "#c9a84c"],
              [String(stats.totalDownloads), "Downloads", "#4ade80"],
              [String(stats.totalViews), "Views", "#7aaeed"],
              [String(stats.totalBooks), "Books", "#c084fc"],
              [String(stats.subscriberGrowth), "Subscribers", "#f97316"],
              [String(stats.totalInquiries), "Inquiries", "#60a5fa"],
              [String(stats.totalReviews), "Reviews", "#a3c97a"],
[stats.avgRating ? `${stats.avgRating} ★` : "N/A", "Avg Rating", "#c9a84c"],            ].map(([n, l, c]) => (
              <div key={l} style={S.stat}>
                <div style={{ fontSize: 10, color: "#4a3a5a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "Cinzel, serif" }}>{l}</div>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, fontWeight: 700, color: c }}>{n}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "#c9a84c" }}>All Books</div>
        <button style={S.primaryBtn} onClick={() => { setEditingBook(null); setAdminView("edit-book"); }}>+ New Book</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {books.map(b => (
          <div key={b.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", flexWrap: "wrap" }}>
            <BookCover book={b} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 15, color: "#ede0cc" }}>{b.title}</div>
              <div style={{ fontSize: 11, color: "#5a4a6a", marginTop: 2, fontFamily: "Cinzel, serif" }}>{b.genre} · {b.pages}p · {b.downloads} dl</div>
            </div>
            <div style={{ fontFamily: "Cinzel, serif", fontSize: 13, color: "#c9a84c" }}>{b.price === 0 ? "Free" : `GH₵ ${b.price.toFixed(2)}`}</div>
            <span style={S.badge(b.published ? "#4ade80" : "#f59e0b")}>{b.published ? "Live" : "Draft"}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ ...S.secondaryBtn, fontSize: 11, padding: "5px 12px" }} onClick={() => { setEditingBook(b); setAdminView("edit-book"); }}>Edit</button>
              <button style={{ ...S.secondaryBtn, fontSize: 11, padding: "5px 12px", color: b.published ? "#f87171" : "#4ade80", borderColor: b.published ? "#f8717144" : "#4ade8044" }} onClick={() => togglePublish(b)}>
                {b.published ? "Unpublish" : "Publish"}
              </button>
              <button style={{ ...S.dangerBtn, padding: "5px 12px" }} onClick={() => deleteBook(b)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function SeriesSelect({ value, onChange }) {
  const [series, setSeries] = useState([]);
  useEffect(() => {
    fetch(`${API}/api/series`).then(r => r.json())
      .then(d => setSeries(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  return (
    <select style={S.input} value={value || ""} onChange={e => onChange(e.target.value || null)}>
      <option value="">No Series</option>
      {series.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  );
}
// ─── BOOK EDITOR — defined OUTSIDE App, fixes the input/dictation bug ─────
function BookEditor({ initial }) {
  const { adminToken, showNotif, setAdminView, fetchAdminBooks } = useCtx();
  const isNew = !initial;
  const [form, setForm] = useState(() => initial ? { ...initial } : {
    title: "", author: "Abednego Appiah Mensah", genre: "Divine Mystery", price: 0,
    description: "", content: "", pages: 0, published: false,
    coverPalette: Math.floor(Math.random() * COVER_PALETTES.length),
    coverPattern: Math.floor(Math.random() * COVER_SYMBOLS.length),
    coverImage: null, downloads: 0, views: 0,
    createdAt: new Date().toISOString().split("T")[0],
  });
  const [isListening, setIsListening] = useState(false);
  const [dictationLang, setDictationLang] = useState("en-US");
  const [uploading, setUploading] = useState(false);
  const recognitionRef = useRef(null);
  const contentRef = useRef(form.content);

  const set = (key, val) => {
    if (key === "content") contentRef.current = val;
    setForm(f => ({ ...f, [key]: val }));
  };

  const wordCount = (form.content || "").split(/\s+/).filter(Boolean).length;
  const estimatedPages = Math.max(1, Math.round(wordCount / 250));

  // ── DICTATION — stable because component is at module level now ──────────
  const startDictation = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showNotif("Speech recognition requires Chrome or Edge browser", "error");
      return;
    }
    // Requires HTTPS in production (localhost is exempt)
    if (window.location.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      showNotif("Dictation requires HTTPS. It works on localhost.", "error");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      const r = new SR();
r.continuous = true; r.interimResults = false; r.lang = dictationLang;      r.onresult = (e) => {
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        }
        if (final) {
          const updated = (contentRef.current || "") + final;
          contentRef.current = updated;
          setForm(f => ({ ...f, content: updated }));
        }
      };
      r.onerror = (e) => {
        setIsListening(false);
        const msgs = { "not-allowed": "Microphone access denied. Allow it in browser settings.", "no-speech": "No speech detected. Try speaking closer.", "network": "Network error during speech recognition." };
        showNotif(msgs[e.error] || `Speech error: ${e.error}`, "error");
      };
      r.onend = () => setIsListening(false);
      r.start(); recognitionRef.current = r; setIsListening(true);
    }).catch(() => showNotif("Microphone access denied. Allow it in browser settings.", "error"));
  }, [dictationLang, showNotif]);

  const stopDictation = () => { recognitionRef.current?.stop(); setIsListening(false); };

  // Real cover upload to backend — stores URL, not base64
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch(`${API}/api/admin/upload-cover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      set("coverImage", data.url);
      showNotif("Cover uploaded ✦");
    } catch (err) { showNotif(err.message || "Upload failed", "error"); }
    finally { setUploading(false); }
  };

  const handleSave = async (andPublish = false) => {
    if (!form.title.trim()) { showNotif("Title is required", "error"); return; }
    const finalBook = { ...form, content: contentRef.current, pages: form.pages || estimatedPages, published: andPublish };
    try {
      const url = isNew ? `${API}/api/admin/books` : `${API}/api/admin/books/${form.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(finalBook) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed to save"));
      showNotif(isNew ? (andPublish ? "Book published! ✦" : "Book saved as draft.") : "Book updated! ✦");
      setAdminView("dashboard"); fetchAdminBooks();
    } catch (err) { showNotif(err.message || "Error saving book", "error"); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 940, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={() => setAdminView("dashboard")}>← Dashboard</button>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#ede0cc" }}>{isNew ? "New Book" : "Edit Book"}</div>
      </div>

      <div style={{ display: "grid",gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 18 }}>
        <div>
          <label style={S.label}>Book Title *</label>
          <input style={S.input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Enter title…" />
        </div>
        <div>
          <label style={S.label}>Author</label>
          <input style={S.input} value={form.author} onChange={e => set("author", e.target.value)} />
        </div>
        <div>
          <label style={S.label}>Genre</label>
          <select style={S.input} value={form.genre} onChange={e => set("genre", e.target.value)}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Price (GH₵) — 0 = Free</label>
          <input style={S.input} type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
  <label style={S.label}>Book Series (optional)</label>
  <SeriesSelect value={form.seriesId} onChange={val => set("seriesId", val)} />
</div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={S.label}>Description</label>
        <textarea style={{ ...S.textarea, height: 88 }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="A short summary of what God revealed in this book…" />
      </div>

      {/* Cover */}
      <div style={{ marginBottom: 24 }}>
        <label style={S.label}>Book Cover</label>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <BookCover book={form} size="md" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#6a5a4a", marginBottom: 12, fontStyle: "italic" }}>Choose colour palette:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {COVER_PALETTES.map((p, i) => (
                <div key={i} onClick={() => set("coverPalette", i)} style={{ width: 30, height: 30, borderRadius: 4, background: `linear-gradient(135deg, ${p.bg[0]}, ${p.bg[1]})`, cursor: "pointer", border: form.coverPalette === i ? "2px solid #c9a84c" : "2px solid transparent" }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#4a3a5a", marginBottom: 8, fontFamily: "Cinzel, serif" }}>Symbol:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {COVER_SYMBOLS.map((sym, i) => (
                <div key={i} onClick={() => set("coverPattern", i)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: "#16101e", cursor: "pointer", border: form.coverPattern === i ? "1px solid #c9a84c" : "1px solid #2a1e3a", color: "#c9a84c", fontSize: 14 }}>{sym}</div>
              ))}
            </div>
            {/* Real cover upload to backend */}
            <div style={{ fontSize: 11, color: "#4a3a5a", marginBottom: 8, fontFamily: "Cinzel, serif" }}>Or upload custom image:</div>
            <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ fontSize: 12, color: "#6a5a7a" }} disabled={uploading} />
            {uploading && <div style={{ fontSize: 11, color: "#c9a84c", marginTop: 6 }}>Uploading…</div>}
            {form.coverImage && (
              <button style={{ ...S.secondaryBtn, fontSize: 10, marginTop: 8, padding: "4px 12px" }} onClick={() => set("coverImage", null)}>Remove Image</button>
            )}
          </div>
        </div>
      </div>

      {/* Content + Dictation */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <label style={{ ...S.label, margin: 0 }}>Book Content</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select style={{ ...S.input, width: "auto", fontSize: 11, padding: "5px 8px" }} value={dictationLang} onChange={e => setDictationLang(e.target.value)}>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">French</option>
              <option value="ak-GH">Twi / Akan</option>
              <option value="ha-GH">Hausa</option>
            </select>
            <button
              style={{ ...(isListening ? { ...S.primaryBtn, background: "#ef4444", fontSize: 11, padding: "6px 16px" } : { ...S.secondaryBtn, fontSize: 11, padding: "6px 16px" }) }}
              onClick={isListening ? stopDictation : startDictation}
            >
              {isListening ? "⏹ Stop Dictation" : "🎙 Dictate"}
            </button>
            {isListening && <span style={{ fontSize: 11, color: "#ef4444", fontFamily: "Cinzel, serif" }}>● Recording…</span>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#4a3a5a", marginBottom: 10, fontStyle: "italic" }}>
          💡 Click Dictate and speak — works in Chrome/Edge on localhost or HTTPS sites.
        </div>
        <textarea
          style={{ ...S.textarea, height: 420 }}
          value={form.content}
          onChange={e => { contentRef.current = e.target.value; set("content", e.target.value); }}
          placeholder={"Chapter One\n\nBegin writing or dictating your book here...\n\nGod revealed to me that..."}
        />
        <div style={{ fontSize: 12, color: "#4a3a5a", marginTop: 8, display: "flex", gap: 20 }}>
          <span>{wordCount.toLocaleString()} words</span>
          <span>~{estimatedPages} pages estimated</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button style={S.primaryBtn} onClick={() => handleSave(false)}>Save as Draft</button>
        <button style={{ ...S.secondaryBtn, color: "#4ade80", borderColor: "#4ade8044" }} onClick={() => handleSave(true)}>
          {isNew ? "Create & Publish ✦" : (form.published ? "Save Changes" : "Save & Publish ✦")}
        </button>
        <button style={{ ...S.secondaryBtn, fontSize: 12 }} onClick={() => setAdminView("dashboard")}>Cancel</button>
      </div>
    </div>
  );
}

// ─── ADMIN ORDERS ─────────────────────────────────────────────────────────
function AdminOrders() {
  const { adminToken, showNotif } = useCtx();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | failed

  const loadOrders = useCallback(async (p = 1, failedOnly = false) => {
    setLoading(true);
    try {
      const url = failedOnly
        ? `${API}/api/admin/orders/failed-deliveries`
        : `${API}/api/admin/orders?page=${p}&limit=20`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed to load orders"));
      if (failedOnly) { setOrders(Array.isArray(data) ? data : []); setTotalPages(1); }
      else { setOrders(data.items || []); setTotalPages(data.pages || 1); }
    } catch (err) { showNotif(err.message || "Failed to load orders", "error"); }
    finally { setLoading(false); }
  }, [adminToken, showNotif]);

  useEffect(() => { loadOrders(page, tab === "failed"); }, [page, tab, loadOrders]);

  const resend = async (orderId) => {
    try {
      const res = await fetch(`${API}/api/admin/orders/${orderId}/resend`, { method: "POST", headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Resend failed"));
      showNotif("Book resent successfully ✦");
      loadOrders(page, tab === "failed");
    } catch (err) { showNotif(err.message, "error"); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#ede0cc", marginBottom: 24 }}>Orders</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["all", "failed"].map(t => (
          <button key={t} style={{ ...S.secondaryBtn, fontSize: 11, color: tab === t ? "#c9a84c" : "#6a5a4a", borderColor: tab === t ? "#c9a84c44" : "#2a1e3a" }} onClick={() => { setTab(t); setPage(1); }}>
            {t === "all" ? "All Orders" : "⚠ Failed Deliveries"}
          </button>
        ))}
      </div>
      {loading ? <div style={{ color: "#4a3a5a", fontStyle: "italic" }}>Loading…</div> : (
        <>
<div style={{ ...S.card, padding: 0, overflow: "auto" }}>            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 80px", padding: "10px 18px", borderBottom: "1px solid #2a1e3a", fontSize: 10, color: "#4a3a5a", fontFamily: "Cinzel, serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span>Book</span><span>Customer</span><span>Amount</span><span>Status</span><span>Action</span>
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#4a3a5a", fontStyle: "italic" }}>No orders found.</div>
            ) : orders.map((o, i) => (
              <div key={o.id} style={{ ...S.tableRow(i), gridTemplateColumns: "1fr 1fr 100px 100px 80px" }}>
                <div>
                  <div style={{ color: "#ede0cc", fontSize: 13 }}>{o.bookTitle}</div>
                  <div style={{ color: "#3a2a4a", fontSize: 11 }}>{new Date(o.paidAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ color: "#8a7870", fontSize: 12 }}>{o.name}</div>
                  <div style={{ color: "#3a2a4a", fontSize: 11 }}>{o.email}</div>
                </div>
                <div style={{ color: "#c9a84c", fontFamily: "Cinzel, serif", fontSize: 13 }}>GH₵ {o.amount?.toFixed(2)}</div>
                <span style={S.badge(o.emailDelivered ? "#4ade80" : "#f87171")}>{o.emailDelivered ? "Delivered" : "Failed"}</span>
                {!o.emailDelivered && (
                  <button style={{ ...S.greenBtn, fontSize: 10 }} onClick={() => resend(o.id)}>Resend</button>
                )}
              </div>
            ))}
          </div>
          {tab === "all" && totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
              <button style={{ ...S.secondaryBtn, fontSize: 11 }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ fontSize: 12, color: "#5a4a6a", fontFamily: "Cinzel, serif", alignSelf: "center" }}>Page {page} / {totalPages}</span>
              <button style={{ ...S.secondaryBtn, fontSize: 11 }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── ADMIN INQUIRIES ──────────────────────────────────────────────────────
function AdminInquiries() {
  const { adminToken, showNotif } = useCtx();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/inquiries`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await res.json();
      setInquiries(Array.isArray(data) ? data : []);
    } catch { showNotif("Failed to load inquiries", "error"); }
    finally { setLoading(false); }
  }, [adminToken, showNotif]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/api/admin/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ status }) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed to update inquiry"));
      load();
    } catch (err) { showNotif(err.message || "Failed to update inquiry", "error"); }
  };

  const deleteInquiry = async (id) => {
    if (!window.confirm("Delete this inquiry?")) return;
    try {
      const res = await fetch(`${API}/api/admin/inquiries/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed to delete inquiry"));
      showNotif("Deleted."); load();
    } catch (err) { showNotif(err.message || "Failed to delete inquiry", "error"); }
  };

  const statusColors = { new: "#c9a84c", read: "#7aaeed", replied: "#4ade80" };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#ede0cc", marginBottom: 24 }}>Inquiries</div>
      {loading ? <div style={{ color: "#4a3a5a", fontStyle: "italic" }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inquiries.length === 0 && <div style={{ color: "#4a3a5a", fontStyle: "italic" }}>No inquiries yet.</div>}
          {inquiries.map(inq => (
            <div key={inq.id} style={{ ...S.card, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }} onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}>
                <div>
                  <div style={{ fontFamily: "Cinzel, serif", fontSize: 13, color: "#ede0cc", marginBottom: 4 }}>{inq.subject}</div>
                  <div style={{ fontSize: 12, color: "#5a4a6a" }}>{inq.name} · {inq.email} · {new Date(inq.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={S.badge(statusColors[inq.status] || "#c9a84c")}>{inq.status}</span>
                  <span style={{ color: "#5a4a6a", fontSize: 12 }}>{expanded === inq.id ? "▲" : "▼"}</span>
                </div>
              </div>
              {expanded === inq.id && (
                <div style={{ marginTop: 16, borderTop: "1px solid #1a1020", paddingTop: 16 }}>
                  <div style={{ fontSize: 14, color: "#8a7870", lineHeight: 1.8, marginBottom: 16 }}>{inq.message}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["read", "replied"].map(s => (
                      <button key={s} style={{ ...S.greenBtn, fontSize: 11 }} onClick={() => setStatus(inq.id, s)}>Mark {s}</button>
                    ))}
                    <a href={`mailto:${inq.email}?subject=Re: ${inq.subject}`} style={{ ...S.secondaryBtn, fontSize: 11, textDecoration: "none", display: "inline-block" }}>Reply via Email</a>
                    <button style={{ ...S.dangerBtn, fontSize: 11 }} onClick={() => deleteInquiry(inq.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN NEWSLETTER ─────────────────────────────────────────────────────
function AdminNewsletter() {
  const { adminToken, showNotif } = useCtx();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blast, setBlast] = useState({ subject: "", message: "" });
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/admin/newsletter`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(r => r.json()).then(d => setSubscribers(Array.isArray(d) ? d : [])).catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const sendBulk = async () => {
    if (!blast.subject.trim() || !blast.message.trim()) { showNotif("Subject and message required", "error"); return; }
    if (!window.confirm(`Send to all ${subscribers.length} subscribers?`)) return;
    setSending(true); setResult(null);
    try {
      const res = await fetch(`${API}/api/admin/newsletter/send`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(blast) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data); setBlast({ subject: "", message: "" });
      showNotif(`✦ Sent to ${data.sent} subscribers. ${data.failed} failed.`);
    } catch (err) { showNotif(err.message, "error"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#ede0cc", marginBottom: 8 }}>Newsletter</div>
      <div style={{ fontSize: 13, color: "#5a4a6a", marginBottom: 32, fontFamily: "Cinzel, serif" }}>{subscribers.length} subscribers</div>

      {/* Send blast */}
      <div style={{ ...S.card, marginBottom: 32 }}>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 13, color: "#c9a84c", marginBottom: 18, letterSpacing: "0.1em" }}>SEND NEWSLETTER BLAST</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.label}>Subject</label>
            <input style={S.input} placeholder="Newsletter subject…" value={blast.subject} onChange={e => setBlast(b => ({ ...b, subject: e.target.value }))} />
          </div>
          <div>
            <label style={S.label}>Message (HTML supported)</label>
            <textarea style={{ ...S.textarea, height: 160 }} placeholder="Your message to subscribers…" value={blast.message} onChange={e => setBlast(b => ({ ...b, message: e.target.value }))} />
          </div>
          <button style={{ ...S.primaryBtn, opacity: sending ? 0.6 : 1 }} onClick={sendBulk} disabled={sending}>
            {sending ? `Sending to ${subscribers.length} subscribers…` : `✦ Send to All ${subscribers.length} Subscribers`}
          </button>
          {result && (
            <div style={{ fontSize: 13, color: "#4ade80", fontFamily: "Cinzel, serif" }}>
              ✦ Sent: {result.sent} · Failed: {result.failed} · Total: {result.total}
            </div>
          )}
        </div>
      </div>

      {/* Subscriber list */}
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "#c9a84c", marginBottom: 16 }}>Subscriber List</div>
      {loading ? <div style={{ color: "#4a3a5a", fontStyle: "italic" }}>Loading…</div> : (
<div style={{ ...S.card, padding: 0, overflow: "auto" }}>          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 150px", padding: "10px 18px", borderBottom: "1px solid #2a1e3a", fontSize: 10, color: "#4a3a5a", fontFamily: "Cinzel, serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <span>Email</span><span>Name</span><span>Subscribed</span>
          </div>
          {subscribers.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#4a3a5a", fontStyle: "italic" }}>No subscribers yet.</div>}
          {subscribers.map((s, i) => (
            <div key={i} style={{ ...S.tableRow(i), gridTemplateColumns: "1fr 1fr 150px" }}>
              <div style={{ color: "#ede0cc", fontSize: 13 }}>{s.email}</div>
              <div style={{ color: "#6a5a4a", fontSize: 12 }}>{s.name || "—"}</div>
              <div style={{ color: "#3a2a4a", fontSize: 11 }}>{new Date(s.subscribedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN SERIES ─────────────────────────────────────────────────────────
function AdminSeries() {
  const { adminToken, showNotif } = useCtx();
  const [series, setSeries] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/api/series`);
    const data = await res.json();
    setSeries(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) { showNotif("Name required", "error"); return; }
    try {
      const url = editingId ? `${API}/api/admin/series/${editingId}` : `${API}/api/admin/series`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(form) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed"));
      showNotif(editingId ? "Series updated ✦" : "Series created ✦");
      setForm({ name: "", description: "" }); setEditingId(null); load();
    } catch (err) { showNotif(err.message || "Error saving series", "error"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this series? Books in it will be unlinked.")) return;
    try {
      const res = await fetch(`${API}/api/admin/series/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed to delete series"));
      showNotif("Series deleted."); load();
    } catch (err) { showNotif(err.message || "Failed to delete series", "error"); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#ede0cc", marginBottom: 24 }}>Book Series</div>
      <div style={{ ...S.card, marginBottom: 28 }}>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 12, color: "#c9a84c", marginBottom: 16, letterSpacing: "0.1em" }}>
          {editingId ? "EDIT SERIES" : "NEW SERIES"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input style={S.input} placeholder="Series name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <textarea style={{ ...S.textarea, height: 80 }} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.primaryBtn} onClick={save}>{editingId ? "Update Series" : "Create Series ✦"}</button>
            {editingId && <button style={S.secondaryBtn} onClick={() => { setForm({ name: "", description: "" }); setEditingId(null); }}>Cancel</button>}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {series.length === 0 && <div style={{ color: "#4a3a5a", fontStyle: "italic" }}>No series yet.</div>}
        {series.map(s => (
          <div key={s.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, color: "#ede0cc" }}>{s.name}</div>
              {s.description && <div style={{ fontSize: 12, color: "#5a4a6a", marginTop: 4 }}>{s.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.secondaryBtn, fontSize: 11 }} onClick={() => { setForm({ name: s.name, description: s.description || "" }); setEditingId(s.id); }}>Edit</button>
              <button style={{ ...S.dangerBtn, fontSize: 11 }} onClick={() => del(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN REVIEWS ────────────────────────────────────────────────────────
function AdminReviews() {
  const { adminToken, showNotif } = useCtx();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Load all books to get reviews per book
    const res = await fetch(`${API}/api/admin/books`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const bks = await res.json();
    const allReviews = [];
    for (const b of (Array.isArray(bks) ? bks : [])) {
      const r = await fetch(`${API}/api/books/${b.id}/reviews`);
      const data = await r.json();
      if (Array.isArray(data)) allReviews.push(...data.map(rv => ({ ...rv, bookTitle: b.title })));
    }
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setReviews(allReviews);
    setLoading(false);
  }, [adminToken]);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/reviews/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed to delete review"));
      showNotif("Review deleted."); setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) { showNotif(err.message || "Failed to delete review", "error"); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#ede0cc", marginBottom: 24 }}>Reviews</div>
      {loading ? <div style={{ color: "#4a3a5a", fontStyle: "italic" }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.length === 0 && <div style={{ color: "#4a3a5a", fontStyle: "italic" }}>No reviews yet.</div>}
          {reviews.map(r => (
            <div key={r.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontFamily: "Cinzel, serif", fontSize: 12, color: "#c9a84c" }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: "#3a2a4a", marginLeft: 10 }}>on {r.bookTitle}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#c9a84c", fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span style={{ fontSize: 11, color: "#3a2a4a" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  <button style={{ ...S.dangerBtn, fontSize: 10, padding: "3px 10px" }} onClick={() => del(r.id)}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#8a7870", lineHeight: 1.7, fontStyle: "italic" }}>{r.comment}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN LAYOUT ─────────────────────────────────────────────────────────
function AdminLayout() {
  const { adminView, setAdminView, handleLogoutAdmin, setEditingBook } = useCtx();
  const menuItems = [
    ["dashboard", "📚", "Dashboard"],
    ["edit-book", "✦", "New Book"],
    ["orders", "🧾", "Orders"],
    ["inquiries", "✉", "Inquiries"],
    ["newsletter", "📨", "Newsletter"],
    ["series", "📖", "Series"],
    ["reviews", "★", "Reviews"],
  ];
  return (
   <div className="admin-layout" style={{ display: "flex" }}>
  <div className="admin-sidebar" style={S.adminSidebar}>
        <div style={{ padding: "0 22px 18px", marginBottom: 8, borderBottom: "1px solid #1a1020" }}>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: "0.18em", color: "#4a3a5a", textTransform: "uppercase" }}>The Open Scroll</div>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 9, letterSpacing: "0.12em", color: "#3a2a4a", marginTop: 2 }}>Admin Panel</div>
        </div>
        {menuItems.map(([v, ic, label]) => (
          <div key={v} style={S.adminMenuItem(adminView === v)} onClick={() => { setAdminView(v); if (v === "edit-book") setEditingBook(null); }}>
            <span style={{ fontSize: 14 }}>{ic}</span> {label}
          </div>
        ))}
        <div style={{ marginTop: 40, padding: "20px 22px", borderTop: "1px solid #1a1020" }}>
          <button style={{ ...S.secondaryBtn, fontSize: 11, width: "100%" }} onClick={handleLogoutAdmin}>Exit Admin</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {adminView === "dashboard" && <AdminDashboard />}
        {adminView === "edit-book" && <BookEditorWrapper />}
        {adminView === "orders" && <AdminOrders />}
        {adminView === "inquiries" && <AdminInquiries />}
        {adminView === "newsletter" && <AdminNewsletter />}
        {adminView === "series" && <AdminSeries />}
        {adminView === "reviews" && <AdminReviews />}
      </div>
    </div>
  );
}

// Wrapper so key-reset works when switching between new/edit
function BookEditorWrapper() {
  const { editingBook } = useCtx();
  return <BookEditor key={editingBook?.id || "new"} initial={editingBook} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── APP ROOT ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [books, setBooks] = useState([]);
  const [view, setView] = useState("home");
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("admin_token"));
  const [adminView, setAdminView] = useState("dashboard");
  const [editingBook, setEditingBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("All");
  const [filterPrice, setFilterPrice] = useState("All");
const [purchasedBooks, setPurchasedBooks] = useState(() => {
    try { return (JSON.parse(localStorage.getItem("purchased_books") || "[]")).map(String); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState([]);
  const [notification, setNotification] = useState(null);
  const [adminPwd, setAdminPwd] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [unsubEmail, setUnsubEmail] = useState("");

  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);
  const shiftACount = useRef(0);
  const shiftATimer = useRef(null);

  const showNotif = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const fetchPublicBooks = useCallback(async () => {
    try {
const res = await fetch(`${API}/api/books`);
      const data = await res.json();
      setBooks(Array.isArray(data) ? data.map(b => ({ ...b, price: Number(b.price) })) : []);
    } catch { setBooks([]); }
  }, []);

  const fetchAdminBooks = useCallback(async () => {
    if (!adminToken) return;
    try {
const res = await fetch(`${API}/api/admin/books`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Failed to load admin books"));
      setBooks(Array.isArray(data) ? data.map(b => ({ ...b, price: Number(b.price) })) : []);
    } catch (err) { setBooks([]); showNotif(err.message || "Failed to load admin books", "error"); }
  }, [adminToken, showNotif]);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/wishlist`, { headers: { "X-Session-Id": getSessionId() } });
      const data = await res.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch { setWishlist([]); }
  }, []);

  // View tracking
  const openBook = useCallback(async (book) => {
    setSelectedBook(book); setView("book-detail"); window.scrollTo(0, 0);
    try { await fetch(`${API}/api/books/${book.id}/view`, { method: "PATCH" }); } catch {}
  }, []);

  const addToWishlist = useCallback(async (bookId) => {
    try {
      const res = await fetch(`${API}/api/wishlist`, { method: "POST", headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() }, body: JSON.stringify({ bookId }) });
      if (res.status === 409) { showNotif("Already in wishlist", "error"); return; }
      if (!res.ok) throw new Error();
      await fetchWishlist(); showNotif("Added to wishlist ✦");
    } catch { showNotif("Failed to add", "error"); }
  }, [fetchWishlist, showNotif]);

  const removeFromWishlist = useCallback(async (bookId) => {
    try {
      await fetch(`${API}/api/wishlist/${bookId}`, { method: "DELETE", headers: { "X-Session-Id": getSessionId() } });
      await fetchWishlist(); showNotif("Removed from wishlist");
    } catch { showNotif("Failed to remove", "error"); }
  }, [fetchWishlist, showNotif]);

  const handlePaymentVerify = useCallback(async (reference, bookId) => {
    setPaymentVerifying(true);
    try {
      const res = await fetch(`${API}/api/payment/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, bookId }) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(toApiError(data, "Verification failed"));
      localStorage.removeItem("pending_payment");
      const updated = Array.from(new Set([...purchasedBooks, String(bookId)]));
      setPurchasedBooks(updated);
      localStorage.setItem("purchased_books", JSON.stringify(updated));
      showNotif("✦ Payment verified! Your book has been emailed to you.");
    } catch (err) {
      showNotif("Payment issue: " + (err.message || "Unknown error"), "error");
    } finally { setPaymentVerifying(false); }
  }, [purchasedBooks, showNotif]);

  const handleAdminLogin = useCallback(async () => {
    setAdminLoginLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: adminPwd }) });
      const data = await safeJson(res);
      if (!res.ok) { showNotif(toApiError(data, "Wrong password"), "error"); return; }
      setAdminToken(data.token); localStorage.setItem("admin_token", data.token);
      setIsAdmin(true); setShowAdminLogin(false); setAdminPwd(""); setView("admin");
      showNotif("Admin access granted ✦");
    } catch { showNotif("Login failed", "error"); }
    finally { setAdminLoginLoading(false); }
  }, [adminPwd, showNotif]);

  const handleLogoutAdmin = useCallback(() => {
    setIsAdmin(false); setAdminToken(null); localStorage.removeItem("admin_token");
    setView("home"); fetchPublicBooks(); showNotif("Admin mode closed");
  }, [fetchPublicBooks, showNotif]);

  const handleLogoTap = useCallback(() => {
    if (isAdmin) { setView("home"); return; }
    logoTapCount.current++;
    clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 1500);
    if (logoTapCount.current >= 5) { logoTapCount.current = 0; setShowAdminLogin(true); }
    else setView("home");
  }, [isAdmin]);

  // Handle URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    if (params.get("payment") === "success") {
      const reference = params.get("reference") || params.get("trxref");
      const pending = (() => { try { return JSON.parse(localStorage.getItem("pending_payment")); } catch { return null; } })();
      if (reference && pending?.bookId) {
        window.history.replaceState({}, "", pathname);
        handlePaymentVerify(reference, pending.bookId);
      }
    }
    if (pathname === "/unsubscribe") {
      const email = params.get("email");
      if (email) { setUnsubEmail(decodeURIComponent(email)); setView("unsubscribe"); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPublicBooks(); fetchWishlist();
    if (adminToken) { setIsAdmin(true); fetchAdminBooks(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  useEffect(() => {
    const handleKey = (e) => {
      if (isAdmin) return;
      if (e.key === "A" && e.shiftKey) {
        shiftACount.current++;
        clearTimeout(shiftATimer.current);
        shiftATimer.current = setTimeout(() => { shiftACount.current = 0; }, 1000);
        if (shiftACount.current >= 3) { shiftACount.current = 0; setShowAdminLogin(true); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isAdmin]);

  const publishedBooks = books.filter(b => b.published);
  const filteredBooks = publishedBooks.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (b.title || "").toLowerCase().includes(q) || (b.author || "").toLowerCase().includes(q) || (b.description || "").toLowerCase().includes(q);
    const matchGenre = filterGenre === "All" || b.genre === filterGenre;
    const matchPrice = filterPrice === "All" || (filterPrice === "Free" ? b.price === 0 : b.price > 0);
    return matchSearch && matchGenre && matchPrice;
  });

  const ctxValue = {
    books, setBooks, publishedBooks, filteredBooks,
    view, setView, selectedBook, setSelectedBook,
    isAdmin, setIsAdmin, adminToken, setAdminToken,
    adminView, setAdminView, editingBook, setEditingBook,
    searchQuery, setSearchQuery, filterGenre, setFilterGenre, filterPrice, setFilterPrice,
    purchasedBooks, setPurchasedBooks,
    wishlist, setWishlist,
    notification,
    adminPwd, setAdminPwd,
    adminLoginLoading,
    showAdminLogin, setShowAdminLogin,
    paymentVerifying,
    unsubEmail, setUnsubEmail,
    showNotif, fetchPublicBooks, fetchAdminBooks, fetchWishlist,
    openBook, addToWishlist, removeFromWishlist,
    handleAdminLogin, handleLogoutAdmin, handleLogoTap, handlePaymentVerify,
  };

  return (
    <Ctx.Provider value={ctxValue}>
      
     <style>{FONT_IMPORT}{`
  *{box-sizing:border-box;margin:0;padding:0;}
  select option{background:#16101e;color:#ede0cc;}
  button:hover{opacity:0.85;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:#0b0810;}
  ::-webkit-scrollbar-thumb{background:#2a1e3a;border-radius:99px;}
  @keyframes scrollX{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .carousel-track{display:flex;gap:28px;animation:scrollX 40s linear infinite;width:max-content;}
  .carousel-track:hover{animation-play-state:paused;}
  .carousel-wrap{overflow:hidden;position:relative;}
  .carousel-wrap::before,.carousel-wrap::after{content:'';position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none;}
  .carousel-wrap::before{left:0;background:linear-gradient(to right,#0b0810,transparent);}
  .carousel-wrap::after{right:0;background:linear-gradient(to left,#0b0810,transparent);}
  .carousel-card{cursor:pointer;transition:transform 0.3s;flex-shrink:0;padding:0 4px;}
  .carousel-card:hover{transform:translateY(-8px) scale(1.03);}

  @media (max-width: 768px) {
    .admin-layout{flex-direction:column !important;}
    .admin-sidebar{width:100% !important;min-height:auto !important;padding:8px 0 !important;display:flex !important;flex-wrap:wrap !important;gap:0 !important;border-right:none !important;border-bottom:1px solid #1e1428 !important;}
    .admin-sidebar > div:first-child{display:none !important;}
  }

  @media (max-width: 480px) {
    h1{font-size:clamp(28px,8vw,60px) !important;}
    .carousel-wrap::before,.carousel-wrap::after{width:40px;}
  }
`}</style>
      <div style={S.app}>
        <Nav />
        {view === "home"        && <Home />}
        {view === "catalog"     && <Catalog />}
        {view === "contact"     && <Contact />}
        {view === "book-detail" && selectedBook && <BookDetail book={selectedBook} />}
        {view === "reader"      && selectedBook && <Reader book={selectedBook} />}
        {view === "wishlist"    && <WishlistView />}
        {view === "unsubscribe" && <UnsubscribeView />}
        {view === "admin"       && isAdmin && <AdminLayout />}
        {showAdminLogin && <AdminLogin />}
        <Notification />
        <PaymentVerifyingOverlay />
        {view !== "admin" && <Footer />}
      </div>
    </Ctx.Provider>
  );
}