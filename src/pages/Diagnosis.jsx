import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customers } from "../data/customers";
import { colors, fonts, radius, shadows } from "../styles/theme";

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_META = {
  frustrated: {
    label: "Frustrated",
    icon: "😤",
    color: colors.accentRed,
    dim: colors.accentRedDim,
    glow: colors.accentRedGlow,
    border: `${colors.accentRed}40`,
    tagline: "This customer had a bad experience and feels unheard.",
    prescription: "Acknowledge first. Apologize directly. No promotional content.",
    bg: `${colors.accentRed}06`,
  },
  price_sensitive: {
    label: "Price-Sensitive",
    icon: "💸",
    color: colors.accentAmber,
    dim: colors.accentAmberDim,
    glow: `${colors.accentAmber}33`,
    border: `${colors.accentAmber}40`,
    tagline: "This customer is doing a value calculation that hasn't resolved in your favor.",
    prescription: "Reframe value. Offer strategically. Never beg.",
    bg: `${colors.accentAmber}06`,
  },
  gone_quiet: {
    label: "Gone Quiet",
    icon: "🤫",
    color: colors.accentTeal,
    dim: colors.accentTealDim,
    glow: colors.accentTealGlow,
    border: `${colors.accentTeal}40`,
    tagline: "Not angry — just disengaged. Life got busy.",
    prescription: "Low pressure. Remind of value. Don't sound desperate.",
    bg: `${colors.accentTeal}06`,
  },
};

const WEIGHT_META = {
  high:   { label: "HIGH",   color: colors.accentRed,   bar: colors.accentRed,   width: "85%" },
  medium: { label: "MED",    color: colors.accentAmber, bar: colors.accentAmber, width: "55%" },
  low:    { label: "LOW",    color: colors.accentTeal,  bar: colors.accentTeal,  width: "25%" },
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED RISK SCORE — counts up on mount
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedScore({ target, color }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 900;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - pct, 3);
      setDisplay(Math.round(eased * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <span style={{
      fontFamily: fonts.display,
      fontWeight: 900,
      fontSize: 56,
      color,
      lineHeight: 1,
      letterSpacing: "-2px",
    }}>{display}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE ARC — SVG semi-circle gauge
// ─────────────────────────────────────────────────────────────────────────────
function ScoreArc({ score, color }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const W = 200, H = 110, r = 80, cx = 100, cy = 105;
  const angleRange = Math.PI; // 180deg sweep
  const startAngle = Math.PI;
  const pct = Math.min(animated / 100, 1);
  const endAngle = startAngle + pct * angleRange;

  const arc = (a1, a2, ro) => {
    const x1 = cx + ro * Math.cos(a1);
    const y1 = cy + ro * Math.sin(a1);
    const x2 = cx + ro * Math.cos(a2);
    const y2 = cy + ro * Math.sin(a2);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${ro} ${ro} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Track */}
      <path d={arc(Math.PI, 2 * Math.PI, r)} fill="none" stroke={colors.bgBorder} strokeWidth="10" strokeLinecap="round" />
      {/* Fill */}
      <path
        d={arc(Math.PI, endAngle, r)}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        style={{ transition: "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)", filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
      {/* Threshold marker at 70 */}
      {(() => {
        const a = Math.PI + (70 / 100) * Math.PI;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        return <circle cx={x} cy={y} r={4} fill={colors.textMuted} opacity={0.5} />;
      })()}
      {/* Labels */}
      <text x={cx - r - 6} y={cy + 14} fill={colors.textMuted} fontSize="9" textAnchor="middle" fontFamily={fonts.body}>0</text>
      <text x={cx + r + 6} y={cy + 14} fill={colors.textMuted} fontSize="9" textAnchor="middle" fontFamily={fonts.body}>100</text>
      <text x={cx + r * Math.cos(Math.PI + 0.7 * Math.PI) - 4} y={cy + r * Math.sin(Math.PI + 0.7 * Math.PI) - 6}
        fill={colors.textMuted} fontSize="8" textAnchor="middle" fontFamily={fonts.body}>70</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPEWRITER — streams reasoning text character by character
// ─────────────────────────────────────────────────────────────────────────────
function Typewriter({ text, delay = 400 }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    indexRef.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, 14);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ opacity: 0.6, animation: "blink 0.8s step-end infinite" }}>▋</span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL ROW
// ─────────────────────────────────────────────────────────────────────────────
function SignalRow({ signal, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 90);
    return () => clearTimeout(t);
  }, [index]);

  const wm = WEIGHT_META[signal.weight] || WEIGHT_META.low;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "11px 16px",
      background: colors.bgElevated,
      borderRadius: radius.md,
      border: `1px solid ${colors.bgBorder}`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-12px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      {/* Weight badge */}
      <div style={{
        flexShrink: 0,
        width: 36, height: 20,
        background: `${wm.color}18`,
        border: `1px solid ${wm.color}40`,
        borderRadius: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8, fontWeight: 800, color: wm.color,
        letterSpacing: "0.06em",
      }}>{wm.label}</div>

      {/* Label + value */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary, marginBottom: 2 }}>
          {signal.label}
        </div>
        <div style={{ fontSize: 11, color: colors.textSecondary }}>{signal.value}</div>
      </div>

      {/* Mini bar */}
      <div style={{ width: 60, height: 4, background: colors.bgBorder, borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
        <div style={{
          height: "100%", width: wm.width,
          background: wm.bar, borderRadius: 99,
          transition: "width 0.6s ease",
          boxShadow: `0 0 4px ${wm.bar}60`,
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER STAT PILL
// ─────────────────────────────────────────────────────────────────────────────
function StatPill({ label, value, highlight }) {
  return (
    <div style={{
      padding: "10px 14px",
      background: colors.bgElevated,
      border: `1px solid ${colors.bgBorder}`,
      borderRadius: radius.md,
      textAlign: "center",
      flex: 1,
    }}>
      <div style={{
        fontSize: 15, fontWeight: 800, fontFamily: fonts.display,
        color: highlight || colors.textPrimary, marginBottom: 3,
      }}>{value}</div>
      <div style={{ fontSize: 10, color: colors.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Diagnosis() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [reasoningVisible, setReasoningVisible] = useState(false);

  const customer = customers.find(c => c.id === customerId);

  useEffect(() => {
    const t = setTimeout(() => setReasoningVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!customer) return (
    <div style={{ padding: 40, color: colors.textMuted, fontFamily: fonts.body }}>
      Customer not found.
    </div>
  );

  const pm = PROFILE_META[customer.profile] || PROFILE_META.gone_quiet;
  const scoreColor = customer.riskScore >= 85 ? colors.accentRed : customer.riskScore >= 70 ? colors.accentAmber : colors.accentTeal;

  const highSignals = customer.signals.filter(s => s.weight === "high");
  const otherSignals = customer.signals.filter(s => s.weight !== "high");

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bgBase,
      fontFamily: fonts.body,
      color: colors.textPrimary,
      overflowY: "auto",
    }}>
      {/* ── GLOBAL KEYFRAMES ── */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseRed { 0%,100%{box-shadow:0 0 0 0 ${colors.accentRed}40} 50%{box-shadow:0 0 0 8px transparent} }
      `}</style>

      {/* ── BACK NAV ── */}
      <div style={{
        padding: "16px 28px",
        borderBottom: `1px solid ${colors.bgBorder}`,
        background: colors.bgSurface,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: colors.textMuted, fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: 0,
            fontFamily: fonts.body,
          }}
        >
          ← Back
        </button>
        <span style={{ color: colors.bgBorder }}>·</span>
        <span style={{ fontSize: 12, color: colors.textMuted }}>Signal Feed</span>
        <span style={{ color: colors.bgBorder }}>·</span>
        <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>Diagnosis</span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 28px 60px" }}>

        {/* ── HEADER ROW ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 28, gap: 20,
          animation: "fadeUp 0.4s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `linear-gradient(135deg, ${pm.color}30, ${pm.color}10)`,
              border: `2px solid ${pm.color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: pm.color,
              flexShrink: 0,
            }}>{customer.avatar}</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: fonts.display }}>
                {customer.name}
              </h1>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>
                {customer.email} · customer since {customer.joinDate} · flagged {customer.flaggedDate}
              </div>
            </div>
          </div>

          {/* Profile badge */}
          <div style={{
            padding: "10px 16px",
            background: pm.dim,
            border: `1px solid ${pm.border}`,
            borderRadius: radius.lg,
            display: "flex", alignItems: "center", gap: 10,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 22 }}>{pm.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: pm.color, letterSpacing: "-0.2px" }}>{pm.label}</div>
              <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Churn profile</div>
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, animation: "fadeUp 0.4s ease 0.05s both" }}>
          <StatPill label="Total Spend" value={customer.totalSpend} />
          <StatPill label="Days Inactive" value={`${customer.daysSincePurchase}d`} highlight={customer.daysSincePurchase > 45 ? colors.accentAmber : undefined} />
          <StatPill label="Risk Score" value={customer.riskScore} highlight={scoreColor} />
          <StatPill label="Signals" value={customer.signals.length} />
        </div>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* LEFT — Risk gauge */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.bgBorder}`,
            borderRadius: radius.lg,
            padding: "24px 20px 20px",
            display: "flex", flexDirection: "column", alignItems: "center",
            animation: "fadeUp 0.4s ease 0.1s both",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Churn Risk Score
            </div>
            <div style={{ position: "relative", display: "inline-block" }}>
              <ScoreArc score={customer.riskScore} color={scoreColor} />
              <div style={{
                position: "absolute", bottom: 8, left: 0, right: 0,
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <AnimatedScore target={customer.riskScore} color={scoreColor} />
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>out of 100</div>
              </div>
            </div>
            <div style={{
              marginTop: 16, width: "100%",
              padding: "10px 14px",
              background: pm.dim,
              border: `1px solid ${pm.border}`,
              borderRadius: radius.md,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: pm.color, fontWeight: 600 }}>{pm.prescription}</div>
            </div>
          </div>

          {/* RIGHT — Signal weight breakdown */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.bgBorder}`,
            borderRadius: radius.lg,
            padding: "24px 20px",
            animation: "fadeUp 0.4s ease 0.15s both",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
              Signal Weight Breakdown
            </div>
            {/* Weight bars */}
            {[
              { label: "High weight signals", count: customer.signals.filter(s => s.weight === "high").length, color: colors.accentRed, pct: customer.signals.filter(s => s.weight === "high").length / customer.signals.length },
              { label: "Medium weight signals", count: customer.signals.filter(s => s.weight === "medium").length, color: colors.accentAmber, pct: customer.signals.filter(s => s.weight === "medium").length / customer.signals.length },
              { label: "Low weight signals", count: customer.signals.filter(s => s.weight === "low").length, color: colors.accentTeal, pct: customer.signals.filter(s => s.weight === "low").length / customer.signals.length },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: colors.textSecondary }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.count}</span>
                </div>
                <div style={{ height: 6, background: colors.bgBorder, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${row.pct * 100}%`,
                    background: row.color,
                    borderRadius: 99,
                    boxShadow: `0 0 6px ${row.color}60`,
                    transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
              </div>
            ))}

            {/* Category tags */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.bgBorder}` }}>
              <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Signal categories</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Array.from(new Set(customer.signals.map(s =>
                  s.weight === "high" ? "High risk" :
                  s.weight === "medium" ? "Behavioral" : "Contextual"
                ))).map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: "3px 9px", borderRadius: 99,
                    background: colors.bgElevated,
                    border: `1px solid ${colors.bgBorder}`,
                    color: colors.textSecondary,
                  }}>{tag}</span>
                ))}
                <span style={{
                  fontSize: 10, padding: "3px 9px", borderRadius: 99,
                  background: pm.dim, border: `1px solid ${pm.border}`,
                  color: pm.color, fontWeight: 700,
                }}>{pm.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DETECTED SIGNALS ── */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.bgBorder}`,
          borderRadius: radius.lg,
          padding: "24px 20px",
          marginBottom: 20,
          animation: "fadeUp 0.4s ease 0.2s both",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Detected Signals
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>
              {customer.signals.length} signals captured
            </div>
          </div>

          {highSignals.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: colors.accentRed, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8 }}>
                ▲ HIGH WEIGHT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {highSignals.map((s, i) => <SignalRow key={i} signal={s} index={i} />)}
              </div>
            </>
          )}

          {otherSignals.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8 }}>
                SUPPORTING SIGNALS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {otherSignals.map((s, i) => <SignalRow key={i} signal={s} index={highSignals.length + i} />)}
              </div>
            </>
          )}
        </div>

        {/* ── AI REASONING BLOCK ── */}
        <div style={{
          background: pm.bg,
          border: `1px solid ${pm.border}`,
          borderRadius: radius.lg,
          padding: "24px 24px",
          marginBottom: 28,
          animation: "fadeUp 0.4s ease 0.25s both",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: radius.md,
              background: pm.dim, border: `1px solid ${pm.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15,
            }}>🧠</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: pm.color, letterSpacing: "-0.1px" }}>
                AI Diagnosis
              </div>
              <div style={{ fontSize: 10, color: colors.textMuted }}>
                Root cause analysis · {customer.profileLabel} pattern detected
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: pm.color, boxShadow: `0 0 6px ${pm.color}` }} />
              <span style={{ fontSize: 10, color: pm.color, fontWeight: 600 }}>Confident</span>
            </div>
          </div>

          {/* Reasoning text */}
          <div style={{
            fontSize: 14, lineHeight: 1.75, color: colors.textSecondary,
            fontStyle: "normal",
            minHeight: 80,
          }}>
            {reasoningVisible && <Typewriter text={customer.reasoning} delay={200} />}
          </div>

          {/* Profile tagline */}
          <div style={{
            marginTop: 20, paddingTop: 16,
            borderTop: `1px solid ${pm.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{pm.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: pm.color }}>{pm.label} profile</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{pm.tagline}</div>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          animation: "fadeUp 0.4s ease 0.3s both",
        }}>
          <button
            onClick={() => navigate(`/winback/${customer.id}`)}
            style={{
              flex: 1, padding: "16px 0",
              background: `linear-gradient(135deg, ${pm.color}, ${pm.color}CC)`,
              border: "none", borderRadius: radius.lg,
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: "pointer", fontFamily: fonts.body,
              boxShadow: `0 0 24px ${pm.glow}, 0 4px 12px rgba(0,0,0,0.3)`,
              letterSpacing: "-0.3px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 0 32px ${pm.glow}, 0 6px 16px rgba(0,0,0,0.4)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 0 24px ${pm.glow}, 0 4px 12px rgba(0,0,0,0.3)`; }}
          >
            Generate {customer.profileLabel} Recovery Plan →
          </button>
          <button
            onClick={() => navigate("/signals")}
            style={{
              padding: "16px 20px",
              background: "none", border: `1px solid ${colors.bgBorder}`,
              borderRadius: radius.lg, color: colors.textMuted,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              fontFamily: fonts.body,
            }}
          >
            ← Feed
          </button>
        </div>

      </div>
    </div>
  );
}