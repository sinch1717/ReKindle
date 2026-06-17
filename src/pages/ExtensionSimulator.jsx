import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { colors, fonts, radius, shadows } from "../styles/theme";

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIORAL SCORING ENGINE
// Each signal has: weight, category, decay (how fast it fades),
// and a "frustration multiplier" if combined with other signals.
// This mirrors what a real Chrome extension would capture.
// ─────────────────────────────────────────────────────────────────────────────

const SIGNAL_DEFS = {
  sizeChart: {
    id: "sizeChart",
    label: "Size chart revisited",
    detail: "User returned to size guide (×{count})",
    icon: "📐",
    category: "hesitation",
    baseScore: 8,
    decayRate: 0.02,        // score decays per second
    maxStack: 4,            // how many times stacking adds score
    stackMultiplier: 1.4,   // each repeat hits harder
    comboWith: ["checkoutExit", "rageClick"],
  },
  rageClick: {
    id: "rageClick",
    label: "Rage clicking",
    detail: "Rapid repeated clicks on unresponsive element",
    icon: "👆",
    category: "frustration",
    baseScore: 20,
    decayRate: 0.008,
    maxStack: 3,
    stackMultiplier: 1.6,
    comboWith: ["checkoutExit", "sizeChart"],
  },
  checkoutExit: {
    id: "checkoutExit",
    label: "Checkout abandoned",
    detail: "Left checkout flow before payment",
    icon: "🛒",
    category: "intent_drop",
    baseScore: 22,
    decayRate: 0.005,
    maxStack: 2,
    stackMultiplier: 1.8,
    comboWith: ["refundHover", "rageClick"],
  },
  refundHover: {
    id: "refundHover",
    label: "Refund policy dwell",
    detail: "Spent >30s reading return policy",
    icon: "📋",
    category: "anxiety",
    baseScore: 12,
    decayRate: 0.015,
    maxStack: 3,
    stackMultiplier: 1.3,
    comboWith: ["checkoutExit", "priceCompare"],
  },
  priceCompare: {
    id: "priceCompare",
    label: "Comparison page visit",
    detail: "Navigated to /compare (×{count})",
    icon: "🔍",
    category: "price_sensitivity",
    baseScore: 15,
    decayRate: 0.01,
    maxStack: 4,
    stackMultiplier: 1.5,
    comboWith: ["checkoutExit", "refundHover"],
  },
  longInactivity: {
    id: "longInactivity",
    label: "Session stall",
    detail: "No interaction for 45+ seconds",
    icon: "⏸️",
    category: "hesitation",
    baseScore: 10,
    decayRate: 0.025,
    maxStack: 2,
    stackMultiplier: 1.2,
    comboWith: ["sizeChart", "refundHover"],
  },
  scrollJitter: {
    id: "scrollJitter",
    label: "Erratic scrolling",
    detail: "Rapid up-down scroll pattern detected",
    icon: "↕️",
    category: "frustration",
    baseScore: 7,
    decayRate: 0.03,
    maxStack: 3,
    stackMultiplier: 1.3,
    comboWith: ["rageClick", "longInactivity"],
  },
};

const COMBOS = [
  {
    signals: ["rageClick", "checkoutExit"],
    label: "Rage + Abandon",
    bonusScore: 18,
    profile: "frustrated",
  },
  {
    signals: ["checkoutExit", "refundHover", "priceCompare"],
    label: "Price anxiety loop",
    bonusScore: 25,
    profile: "price_sensitive",
  },
  {
    signals: ["sizeChart", "checkoutExit"],
    label: "Fit uncertainty",
    bonusScore: 12,
    profile: "frustrated",
  },
  {
    signals: ["longInactivity", "scrollJitter"],
    label: "Decision paralysis",
    bonusScore: 10,
    profile: "price_sensitive",
  },
];

const FLAG_THRESHOLD = 70;
const DECAY_TICK_MS = 1000;

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE CLASSIFIER
// Based on which signal categories dominate, classify the customer
// ─────────────────────────────────────────────────────────────────────────────
function classifyProfile(signalCounts, combosTriggered) {
  if (combosTriggered.length > 0) {
    const lastCombo = combosTriggered[combosTriggered.length - 1];
    return lastCombo.profile;
  }
  const cats = { frustration: 0, hesitation: 0, intent_drop: 0, anxiety: 0, price_sensitivity: 0 };
  for (const [id, count] of Object.entries(signalCounts)) {
    const def = SIGNAL_DEFS[id];
    if (def && count > 0) cats[def.category] = (cats[def.category] || 0) + count;
  }
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (top === "frustration" || top === "intent_drop") return "frustrated";
  if (top === "price_sensitivity" || top === "anxiety") return "price_sensitive";
  return "gone_quiet";
}

const PROFILE_META = {
  frustrated: {
    label: "Frustrated",
    color: colors.accentRed,
    dim: colors.accentRedDim,
    icon: "😤",
    hint: "Needs acknowledgment, not a promo.",
  },
  price_sensitive: {
    label: "Price-Sensitive",
    color: colors.accentAmber,
    dim: colors.accentAmberDim,
    icon: "💸",
    hint: "Needs value reframe, not a desperate discount.",
  },
  gone_quiet: {
    label: "Gone Quiet",
    color: colors.accentTeal,
    dim: colors.accentTealDim,
    icon: "🤫",
    hint: "Needs a low-pressure nudge, not a sales push.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY COLORS
// ─────────────────────────────────────────────────────────────────────────────
const CAT_COLOR = {
  frustration: colors.accentRed,
  intent_drop: colors.accentRed,
  anxiety: colors.accentAmber,
  price_sensitivity: colors.accentAmber,
  hesitation: colors.accentTeal,
};

// ─────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE — last N score values
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ history, color }) {
  if (history.length < 2) return null;
  const max = Math.max(...history, 100);
  const W = 80, H = 28;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 100 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  const color = score >= 85 ? colors.accentRed : score >= FLAG_THRESHOLD ? colors.accentAmber : colors.accentTeal;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.bgBorder} strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease", filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ExtensionSimulator() {
  const navigate = useNavigate();

  // Core score (float, decays over time)
  const [score, setScore] = useState(12);
  const scoreRef = useRef(12);

  // Per-signal state
  const [signalCounts, setSignalCounts] = useState({});       // { signalId: count }
  const [signalScores, setSignalScores] = useState({});       // { signalId: currentScore }
  const [activeSignals, setActiveSignals] = useState([]);     // ordered list for panel

  // Combo tracking
  const [combosTriggered, setCombosTriggered] = useState([]);
  const [comboFlash, setComboFlash] = useState(null);

  // Flagged state
  const [flagged, setFlagged] = useState(false);
  const [justFlagged, setJustFlagged] = useState(false);

  // Score history for sparkline
  const [scoreHistory, setScoreHistory] = useState([12]);

  // Profile
  const [profile, setProfile] = useState(null);

  // Stall timer (inactivity signal)
  const lastActionRef = useRef(Date.now());
  const stallFiredRef = useRef(false);

  // Scroll jitter detection
  const lastScrollYRef = useRef(0);
  const scrollFlipsRef = useRef(0);
  const scrollTimerRef = useRef(null);

  // ── DECAY ENGINE ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalScores(prev => {
        const next = { ...prev };
        let total = 12; // baseline
        for (const [id, s] of Object.entries(next)) {
          const decayed = Math.max(0, s - SIGNAL_DEFS[id].decayRate * 10);
          next[id] = decayed;
          total += decayed;
        }
        const clamped = Math.min(99, Math.round(total));
        scoreRef.current = clamped;
        setScore(clamped);
        setScoreHistory(h => [...h.slice(-30), clamped]);

        if (clamped >= FLAG_THRESHOLD && !flagged) {
          setFlagged(true);
          setJustFlagged(true);
          setTimeout(() => setJustFlagged(false), 3000);
        }
        return next;
      });
    }, DECAY_TICK_MS);
    return () => clearInterval(interval);
  }, [flagged]);

  // ── STALL DETECTION ───────────────────────────────────────────────────────
  useEffect(() => {
    const stall = setInterval(() => {
      const idle = (Date.now() - lastActionRef.current) / 1000;
      if (idle > 45 && !stallFiredRef.current) {
        stallFiredRef.current = true;
        fireSignal("longInactivity");
      }
      if (idle < 5) stallFiredRef.current = false;
    }, 2000);
    return () => clearInterval(stall);
  }, []);

  // ── COMBO CHECKER ─────────────────────────────────────────────────────────
  const checkCombos = useCallback((counts) => {
    for (const combo of COMBOS) {
      const hit = combo.signals.every(s => (counts[s] || 0) > 0);
      if (hit) {
        setCombosTriggered(prev => {
          if (prev.find(c => c.label === combo.label)) return prev;
          setComboFlash(combo);
          setTimeout(() => setComboFlash(null), 2500);
          return [...prev, combo];
        });
        setScore(s => Math.min(99, s + combo.bonusScore));
        scoreRef.current = Math.min(99, scoreRef.current + combo.bonusScore);
      }
    }
  }, []);

  // ── FIRE SIGNAL ───────────────────────────────────────────────────────────
  const fireSignal = useCallback((signalId) => {
    lastActionRef.current = Date.now();
    const def = SIGNAL_DEFS[signalId];
    if (!def) return;

    setSignalCounts(prev => {
      const count = (prev[signalId] || 0) + 1;
      const next = { ...prev, [signalId]: count };
      checkCombos(next);
      return next;
    });

    setSignalScores(prev => {
      const existing = prev[signalId] || 0;
      const stackCount = Math.min((signalCounts[signalId] || 0), def.maxStack - 1);
      const multiplier = Math.pow(def.stackMultiplier, stackCount);
      const added = def.baseScore * multiplier;
      return { ...prev, [signalId]: Math.min(existing + added, 60) };
    });

    setActiveSignals(prev => {
      const filtered = prev.filter(s => s.id !== signalId);
      const count = (signalCounts[signalId] || 0) + 1;
      const entry = {
        id: signalId,
        label: def.label,
        detail: def.detail.replace("{count}", count),
        icon: def.icon,
        category: def.category,
        count,
        ts: Date.now(),
      };
      return [entry, ...filtered].slice(0, 12);
    });

    // Update profile
    setSignalCounts(counts => {
      const updated = { ...counts, [signalId]: (counts[signalId] || 0) + 1 };
      setProfile(classifyProfile(updated, combosTriggered));
      return updated;
    });
  }, [signalCounts, combosTriggered, checkCombos]);

  // ── SCROLL JITTER DETECTION on the store pane ─────────────────────────────
  const handleStoreScroll = useCallback((e) => {
    const y = e.currentTarget.scrollTop;
    const dir = y > lastScrollYRef.current ? 1 : -1;
    lastScrollYRef.current = y;

    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollFlipsRef.current += 1;

    scrollTimerRef.current = setTimeout(() => {
      if (scrollFlipsRef.current >= 5) fireSignal("scrollJitter");
      scrollFlipsRef.current = 0;
    }, 800);
  }, [fireSignal]);

  const profileMeta = profile ? PROFILE_META[profile] : null;
  const barColor = score >= 85 ? colors.accentRed : score >= FLAG_THRESHOLD ? colors.accentAmber : colors.accentTeal;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: fonts.body }}>

      {/* ── LEFT: FAKE ECOMMERCE STORE ────────────────────────────────────── */}
      <div
        style={{ flex: 1, background: "#F8F7F4", color: "#111", overflowY: "auto", display: "flex", flexDirection: "column" }}
        onScroll={handleStoreScroll}
      >
        {/* Store nav */}
        <div style={{ padding: "14px 28px", background: "#fff", borderBottom: "1px solid #E5E5E5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>F</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>FashionHub</span>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#555" }}>
            {["Men", "Women", "Sale", "About"].map(n => (
              <span key={n} style={{ cursor: "pointer" }}>{n}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#555" }}>
            <span style={{ cursor: "pointer" }}>Search</span>
            <span style={{ cursor: "pointer" }}>🛒 1</span>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{ padding: "10px 28px", fontSize: 12, color: "#888" }}>
          Home / Men / Hoodies / <span style={{ color: "#111" }}>Premium Hoodie — Charcoal</span>
        </div>

        {/* Product layout */}
        <div style={{ display: "flex", gap: 40, padding: "20px 28px 40px", maxWidth: 900 }}>

          {/* Product image */}
          <div style={{ width: 340, flexShrink: 0 }}>
            <div style={{
              width: 340, height: 400, background: "linear-gradient(145deg, #2a2a2a, #444)",
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 48, color: "#888", position: "relative", overflow: "hidden",
            }}>
              👕
              <div style={{ position: "absolute", top: 12, left: 12, background: "#FF4D6D", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                BEST SELLER
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {["#2a2a2a", "#5a3e28", "#1a3a5c"].map(c => (
                <div key={c} style={{ width: 44, height: 44, borderRadius: 6, background: c, border: c === "#2a2a2a" ? "2px solid #111" : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
          </div>

          {/* Product details */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Mens / Knitwear
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
              Premium Heavyweight Hoodie
            </h1>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
              ★★★★☆ <span style={{ color: "#555" }}>4.2 (238 reviews)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 26, fontWeight: 800 }}>$89</span>
              <span style={{ fontSize: 16, color: "#aaa", textDecoration: "line-through" }}>$120</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2a7a2a", background: "#e8f5e9", padding: "3px 8px", borderRadius: 4 }}>
                26% off
              </span>
            </div>

            {/* Size selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Select Size</span>
                <button
                  onClick={() => fireSignal("sizeChart")}
                  style={{ fontSize: 12, color: "#555", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Size Guide →
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["XS", "S", "M", "L", "XL", "2XL"].map((s, i) => (
                  <button key={s} style={{
                    width: 44, height: 44, borderRadius: 6, border: i === 2 ? "2px solid #111" : "1px solid #ddd",
                    background: i === 2 ? "#111" : "#fff", color: i === 2 ? "#fff" : "#333",
                    fontWeight: i === 2 ? 700 : 400, cursor: "pointer", fontSize: 12,
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => fireSignal("checkoutExit")}
                style={{
                  flex: 1, padding: "14px 0", background: "#111", color: "#fff",
                  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
                  cursor: "pointer", letterSpacing: "-0.2px",
                }}
              >
                Add to Cart
              </button>
              <button
                onClick={() => fireSignal("rageClick")}
                style={{
                  flex: 1, padding: "14px 0", background: "#f5f5f5", color: "#333",
                  border: "1px solid #ddd", borderRadius: 8, fontWeight: 600, fontSize: 14,
                  cursor: "pointer", letterSpacing: "-0.2px",
                }}
              >
                Buy Now (broken)
              </button>
            </div>

            {/* Policy links */}
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#666", marginBottom: 20 }}>
              <button
                onClick={() => fireSignal("refundHover")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#555", textDecoration: "underline", fontSize: 12 }}
              >
                📋 Refund Policy
              </button>
              <button
                onClick={() => fireSignal("priceCompare")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#555", textDecoration: "underline", fontSize: 12 }}
              >
                🔍 Compare Prices
              </button>
            </div>

            {/* Trust signals */}
            <div style={{ display: "flex", gap: 16, padding: 16, background: "#fff", borderRadius: 10, border: "1px solid #E5E5E5" }}>
              {[["🚚", "Free shipping over $60"], ["↩️", "30-day returns"], ["🔒", "Secure checkout"]].map(([ico, txt]) => (
                <div key={txt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#555" }}>
                  <span>{ico}</span><span>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews section (scrollable content to trigger scroll jitter) */}
        <div style={{ padding: "0 28px 40px", maxWidth: 900 }}>
          <div style={{ borderTop: "1px solid #E5E5E5", paddingTop: 24, marginBottom: 16, fontWeight: 700, fontSize: 16 }}>
            Customer Reviews
          </div>
          {[
            { name: "Sarah M.", rating: 5, text: "Absolutely love this hoodie. Super cozy and the quality is exceptional. True to size!" },
            { name: "James K.", rating: 4, text: "Great quality but runs slightly large. I'd recommend sizing down. Really warm though." },
            { name: "Priya L.", rating: 3, text: "Nice hoodie but delivery took longer than expected. Material is good quality." },
            { name: "Tom H.", rating: 5, text: "Best hoodie I've ever owned. The fabric is thick and doesn't pill after washing." },
          ].map(r => (
            <div key={r.name} style={{ padding: "16px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span>
                <span style={{ color: "#f5a623", fontSize: 12 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>{r.text}</p>
            </div>
          ))}
        </div>

        {/* Hint bar at bottom of store */}
        <div style={{ padding: "12px 28px", background: "#fff", borderTop: "1px solid #E5E5E5", fontSize: 11, color: "#999", textAlign: "center" }}>
          Interact with the store above to generate frustration signals → captured live in the extension panel →
        </div>
      </div>

      {/* ── RIGHT: REKINDLE EXTENSION PANEL ────────────────────────────────── */}
      <div style={{
        width: 400,
        background: colors.bgBase,
        color: colors.textPrimary,
        borderLeft: `1px solid ${colors.bgBorder}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: fonts.body,
        overflow: "hidden",
        flexShrink: 0,
      }}>

        {/* Extension header */}
        <div style={{
          padding: "16px 20px 14px",
          borderBottom: `1px solid ${colors.bgBorder}`,
          background: colors.bgSurface,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5,
                background: `linear-gradient(135deg, ${colors.accentRed}, #C1384F)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11,
              }}>🔥</div>
              <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "-0.2px", fontFamily: fonts.display }}>
                ReKindle
              </span>
              <span style={{ fontSize: 9, background: colors.accentTealDim, color: colors.accentTeal, padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.04em" }}>
                MONITORING
              </span>
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>Behavioral signal capture · FashionHub</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 2 }}>session</div>
            <div style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "monospace" }}>
              {Object.values(signalCounts).reduce((a, b) => a + b, 0)} events
            </div>
          </div>
        </div>

        {/* Risk score section */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${colors.bgBorder}`,
          background: justFlagged ? `${colors.accentRed}08` : "transparent",
          transition: "background 0.6s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Ring + score */}
            <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
              <ScoreRing score={score} size={90} />
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontFamily: fonts.display, fontWeight: 900, fontSize: 24,
                  color: barColor, lineHeight: 1,
                  transition: "color 0.4s ease",
                }}>{score}</span>
                <span style={{ fontSize: 8, color: colors.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>risk</span>
              </div>
            </div>

            {/* Score details */}
            <div style={{ flex: 1 }}>
              {/* Threshold bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: colors.textMuted }}>Frustration threshold</span>
                  <span style={{ fontSize: 10, color: flagged ? colors.accentRed : colors.textMuted, fontWeight: flagged ? 700 : 400 }}>
                    {flagged ? "EXCEEDED" : `${FLAG_THRESHOLD - score > 0 ? FLAG_THRESHOLD - score : 0} away`}
                  </span>
                </div>
                <div style={{ height: 6, background: colors.bgBorder, borderRadius: 99, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    position: "absolute", left: `${FLAG_THRESHOLD}%`, top: 0,
                    width: 2, height: "100%", background: colors.textMuted, opacity: 0.5, zIndex: 2,
                  }} />
                  <div style={{
                    height: "100%", width: `${score}%`,
                    background: `linear-gradient(90deg, ${barColor}60, ${barColor})`,
                    borderRadius: 99,
                    transition: "width 0.5s ease, background 0.4s ease",
                    boxShadow: flagged ? `0 0 8px ${barColor}60` : "none",
                  }} />
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: colors.textMuted }}>Trend</span>
                <Sparkline history={scoreHistory} color={barColor} />
              </div>
            </div>
          </div>

          {/* Profile badge */}
          {profileMeta && (
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: profileMeta.dim,
              border: `1px solid ${profileMeta.color}30`,
              borderRadius: radius.md,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>{profileMeta.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: profileMeta.color, marginBottom: 2 }}>
                  {profileMeta.label}
                </div>
                <div style={{ fontSize: 10, color: colors.textMuted }}>{profileMeta.hint}</div>
              </div>
            </div>
          )}

          {/* Flagged alert */}
          {flagged && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: colors.accentRedDim,
              border: `1px solid ${colors.accentRed}40`,
              borderRadius: radius.md,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: colors.accentRed,
                  boxShadow: `0 0 6px ${colors.accentRed}`,
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.accentRed }}>CUSTOMER FLAGGED</span>
              </div>
              <span style={{ fontSize: 10, color: colors.textMuted }}>Ready for diagnosis</span>
            </div>
          )}
        </div>

        {/* Combo flash */}
        {comboFlash && (
          <div style={{
            margin: "10px 16px 0",
            padding: "10px 14px",
            background: `${colors.accentAmber}18`,
            border: `1px solid ${colors.accentAmber}50`,
            borderRadius: radius.md,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.accentAmber }}>Combo detected: {comboFlash.label}</div>
              <div style={{ fontSize: 10, color: colors.textMuted }}>+{comboFlash.bonusScore} risk · {comboFlash.profile.replace("_", "-")} profile locked</div>
            </div>
          </div>
        )}

        {/* Combos fired summary */}
        {combosTriggered.length > 0 && !comboFlash && (
          <div style={{ padding: "8px 16px 0" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {combosTriggered.map(c => (
                <span key={c.label} style={{
                  fontSize: 9, fontWeight: 700,
                  background: colors.accentAmberDim,
                  color: colors.accentAmber,
                  padding: "2px 8px", borderRadius: 99,
                  border: `1px solid ${colors.accentAmber}30`,
                  letterSpacing: "0.04em",
                }}>{c.label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Signals list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          <div style={{ padding: "0 16px 8px", fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Captured Signals
          </div>

          {activeSignals.length === 0 && (
            <div style={{ padding: "20px 16px", fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
              No signals yet.<br />
              <span style={{ fontSize: 11 }}>Interact with the store to generate events.</span>
            </div>
          )}

          {activeSignals.map((sig) => {
            const catColor = CAT_COLOR[sig.category] || colors.textSecondary;
            const def = SIGNAL_DEFS[sig.id];
            const currentScore = signalScores[sig.id] || 0;
            const maxPossible = def ? def.baseScore * Math.pow(def.stackMultiplier, def.maxStack - 1) : 30;
            const pct = Math.min(currentScore / maxPossible, 1);
            return (
              <div key={sig.id} style={{
                margin: "0 10px 6px",
                padding: "10px 12px",
                background: colors.bgSurface,
                borderRadius: radius.md,
                border: `1px solid ${colors.bgBorder}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{sig.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>{sig.label}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>{sig.detail}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: catColor }}>{Math.round(currentScore)}</div>
                    <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{sig.category.replace("_", " ")}</div>
                  </div>
                </div>
                {/* Signal decay bar */}
                <div style={{ height: 3, background: colors.bgBorder, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct * 100}%`,
                    background: catColor, borderRadius: 99,
                    transition: "width 0.5s ease",
                    opacity: 0.8,
                  }} />
                </div>
                {sig.count > 1 && (
                  <div style={{ marginTop: 4, fontSize: 9, color: colors.accentAmber }}>
                    ×{sig.count} — stacking ({Math.round((Math.pow(def.stackMultiplier, Math.min(sig.count - 1, def.maxStack - 1)) - 1) * 100)}% multiplier active)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${colors.bgBorder}`, background: colors.bgSurface }}>
          {flagged ? (
            <button
              onClick={() => navigate("/diagnosis/c1")}
              style={{
                width: "100%", padding: "12px 0",
                background: `linear-gradient(135deg, ${colors.accentRed}, #C1384F)`,
                border: "none", borderRadius: radius.md,
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: fonts.body,
                boxShadow: shadows.redGlow,
                letterSpacing: "-0.2px",
              }}
            >
              Run AI Diagnosis on this customer →
            </button>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 0", borderRadius: radius.md,
              background: colors.bgElevated, border: `1px solid ${colors.bgBorder}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.accentTeal, boxShadow: `0 0 6px ${colors.accentTeal}` }} />
              <span style={{ fontSize: 12, color: colors.textMuted }}>
                Monitoring · {FLAG_THRESHOLD - score > 0 ? FLAG_THRESHOLD - score : 0} pts to flag
              </span>
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 10, color: colors.textMuted, textAlign: "center" }}>
            Signals decay over time · combos amplify score · threshold = {FLAG_THRESHOLD}
          </div>
        </div>
      </div>
    </div>
  );
}