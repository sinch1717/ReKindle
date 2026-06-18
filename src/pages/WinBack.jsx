import React, { useState, useEffect } from "react";
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
    strategy: "Acknowledge → Apologize → Invite back",
    rationale: "No promotions until trust is rebuilt. Lead with humanity.",
    stepColors: [colors.accentRed, colors.accentAmber, colors.accentTeal],
  },
  price_sensitive: {
    label: "Price-Sensitive",
    icon: "💸",
    color: colors.accentAmber,
    dim: colors.accentAmberDim,
    glow: `${colors.accentAmber}33`,
    border: `${colors.accentAmber}40`,
    strategy: "Understand → Reframe value → Strategic offer",
    rationale: "Never lead with discounts. Win on ROI, not desperation.",
    stepColors: [colors.accentAmber, colors.accentAmber, colors.accentRed],
  },
  gone_quiet: {
    label: "Gone Quiet",
    icon: "🤫",
    color: colors.accentTeal,
    dim: colors.accentTealDim,
    glow: colors.accentTealGlow,
    border: `${colors.accentTeal}40`,
    strategy: "Check in → Re-engage → Leave door open",
    rationale: "Low pressure only. They're not angry — just drifted.",
    stepColors: [colors.accentTeal, colors.accentTeal, colors.accentTeal],
  },
};

const TONE_COLORS = {
  "Sincere apology":          { bg: colors.accentRedDim,   border: `${colors.accentRed}30`,   text: colors.accentRed },
  "Accountability + progress":{ bg: colors.accentAmberDim, border: `${colors.accentAmber}30`, text: colors.accentAmber },
  "Low pressure, human":      { bg: colors.accentTealDim,  border: `${colors.accentTeal}30`,  text: colors.accentTeal },
  "Curious, not pushy":       { bg: colors.accentTealDim,  border: `${colors.accentTeal}30`,  text: colors.accentTeal },
  "Value reframe, confident": { bg: colors.accentAmberDim, border: `${colors.accentAmber}30`, text: colors.accentAmber },
  "Confident offer, time-limited": { bg: colors.accentRedDim, border: `${colors.accentRed}30`, text: colors.accentRed },
  "Relationship-first, personal":  { bg: colors.accentTealDim,  border: `${colors.accentTeal}30`,  text: colors.accentTeal },
  "Warm update, not promotional":  { bg: colors.accentTealDim,  border: `${colors.accentTeal}30`,  text: colors.accentTeal },
  "Gracious, genuine":        { bg: colors.accentTealDim,  border: `${colors.accentTeal}30`,  text: colors.accentTeal },
  "Value activation":         { bg: colors.accentAmberDim, border: `${colors.accentAmber}30`, text: colors.accentAmber },
  "Empowering, honest":       { bg: colors.accentTealDim,  border: `${colors.accentTeal}30`,  text: colors.accentTeal },
};

function getTone(tone) {
  return TONE_COLORS[tone] || { bg: colors.bgElevated, border: colors.bgBorder, text: colors.textSecondary };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL PREVIEW — styled like a real email client
// ─────────────────────────────────────────────────────────────────────────────
function EmailPreview({ step, pm, visible }) {
  const lines = step.body.split("\n");

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
      background: colors.bgBase,
      border: `1px solid ${colors.bgBorder}`,
      borderRadius: radius.lg,
      overflow: "hidden",
      flex: 1,
    }}>
      {/* Email client chrome */}
      <div style={{
        background: colors.bgSurface,
        borderBottom: `1px solid ${colors.bgBorder}`,
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
          ))}
        </div>
        <div style={{
          flex: 1, background: colors.bgElevated, borderRadius: 6,
          padding: "4px 10px", fontSize: 10, color: colors.textMuted,
          marginLeft: 8,
        }}>
          Gmail · Inbox
        </div>
      </div>

      {/* Email header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.bgBorder}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 10, letterSpacing: "-0.2px" }}>
          {step.subject}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: `linear-gradient(135deg, ${pm.color}30, ${pm.color}10)`,
              border: `1px solid ${pm.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: pm.color,
            }}>RK</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>ReKindle Team</div>
              <div style={{ fontSize: 10, color: colors.textMuted }}>hello@rekindle.ai → you</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted }}>
            {step.timing} · 10:24 AM
          </div>
        </div>
      </div>

      {/* Email body */}
      <div style={{
        padding: "20px 20px 24px",
        fontSize: 13,
        lineHeight: 1.8,
        color: colors.textSecondary,
        maxHeight: 280,
        overflowY: "auto",
      }}>
        {lines.map((line, i) => (
          line === "" ? <div key={i} style={{ height: 10 }} /> :
          <p key={i} style={{ margin: 0 }}>{line}</p>
        ))}
      </div>

      {/* CTA preview */}
      {step.cta !== "No CTA — just acknowledgment" && step.cta !== "Reply to this email" && (
        <div style={{
          padding: "12px 20px",
          borderTop: `1px solid ${colors.bgBorder}`,
          background: colors.bgSurface,
        }}>
          <div style={{
            display: "inline-block",
            padding: "8px 16px",
            background: pm.dim,
            border: `1px solid ${pm.border}`,
            borderRadius: radius.md,
            fontSize: 12,
            fontWeight: 600,
            color: pm.color,
            cursor: "pointer",
          }}>
            {step.cta}
          </div>
        </div>
      )}
      {step.cta === "Reply to this email" && (
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.bgBorder}`, background: colors.bgSurface }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px",
            background: colors.bgElevated,
            borderRadius: radius.md,
            border: `1px solid ${colors.bgBorder}`,
          }}>
            <span style={{ fontSize: 11, color: colors.textMuted }}>↩ Reply to Alex...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP NODE — left-side timeline
// ─────────────────────────────────────────────────────────────────────────────
function StepNode({ step, index, isActive, isCompleted, color, onClick, visible }) {
  const tone = getTone(step.tone);
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "14px 16px",
        background: isActive ? colors.bgElevated : colors.bgSurface,
        border: `1px solid ${isActive ? color + "50" : colors.bgBorder}`,
        borderRadius: radius.lg,
        transition: "all 0.2s ease",
        boxShadow: isActive ? `0 0 16px ${color}20` : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-10px)",
      }}
    >
      {/* Step number + timing */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: isActive ? color : colors.bgElevated,
            border: `2px solid ${isActive ? color : colors.bgBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800,
            color: isActive ? "#fff" : colors.textMuted,
            transition: "all 0.2s ease",
            boxShadow: isActive ? `0 0 8px ${color}60` : "none",
            flexShrink: 0,
          }}>{index + 1}</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? colors.textPrimary : colors.textMuted }}>
            {step.timing}
          </span>
        </div>
        <div style={{
          fontSize: 9, padding: "2px 7px", borderRadius: 99,
          background: tone.bg, border: `1px solid ${tone.border}`,
          color: tone.text, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          {step.tone}
        </div>
      </div>

      {/* Subject */}
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: isActive ? colors.textPrimary : colors.textSecondary,
        marginBottom: 5, lineHeight: 1.4,
      }}>
        {step.subject}
      </div>

      {/* Preview */}
      <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.5 }}>
        {step.preview}
      </div>

      {/* CTA */}
      {step.cta !== "No CTA — just acknowledgment" && (
        <div style={{
          marginTop: 8, fontSize: 10,
          color: isActive ? color : colors.textMuted,
          fontWeight: 600,
        }}>
          CTA: {step.cta}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function WinBack() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [stepVisible, setStepVisible] = useState([false, false, false]);
  const [copied, setCopied] = useState(false);

  const customer = customers.find(c => c.id === customerId);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    [0, 1, 2].forEach(i => {
      const t = setTimeout(() => {
        setStepVisible(prev => { const n = [...prev]; n[i] = true; return n; });
      }, 200 + i * 100);
      return () => clearTimeout(t);
    });
  }, []);

  const handleCopy = () => {
    const step = customer.winBackSequence[activeStep];
    navigator.clipboard.writeText(`Subject: ${step.subject}\n\n${step.body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!customer) return (
    <div style={{ padding: 40, color: colors.textMuted, fontFamily: fonts.body }}>Customer not found.</div>
  );

  const pm = PROFILE_META[customer.profile] || PROFILE_META.gone_quiet;
  const currentStep = customer.winBackSequence[activeStep];
  const stepColor = pm.stepColors[activeStep] || pm.color;

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bgBase,
      fontFamily: fonts.body,
      color: colors.textPrimary,
      overflowY: "auto",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      {/* ── BREADCRUMB ── */}
      <div style={{
        padding: "16px 28px",
        borderBottom: `1px solid ${colors.bgBorder}`,
        background: colors.bgSurface,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: 0, fontFamily: fonts.body }}>
          ← Back
        </button>
        <span style={{ color: colors.bgBorder }}>·</span>
        <span style={{ fontSize: 12, color: colors.textMuted, cursor: "pointer" }} onClick={() => navigate(`/diagnosis/${customer.id}`)}>Diagnosis</span>
        <span style={{ color: colors.bgBorder }}>·</span>
        <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>Win-Back</span>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 28px 60px" }}>

        {/* ── HEADER ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 24, gap: 20,
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${pm.color}30, ${pm.color}10)`,
                border: `2px solid ${pm.color}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: pm.color,
              }}>{customer.avatar}</div>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", fontFamily: fonts.display }}>
                  Recovery Plan — {customer.name}
                </h1>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  {customer.email} · {customer.totalSpend} LTV · {customer.daysSincePurchase}d inactive
                </div>
              </div>
            </div>
          </div>

          {/* Profile + strategy */}
          <div style={{
            padding: "12px 16px",
            background: pm.dim,
            border: `1px solid ${pm.border}`,
            borderRadius: radius.lg,
            flexShrink: 0,
            maxWidth: 260,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{pm.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: pm.color }}>{pm.label}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 3 }}>
              {pm.strategy}
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>
              {pm.rationale}
            </div>
          </div>
        </div>

        {/* ── SEQUENCE PROGRESS BAR ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          marginBottom: 24,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease 0.1s",
        }}>
          {customer.winBackSequence.map((s, i) => (
            <React.Fragment key={i}>
              <div
                onClick={() => setActiveStep(i)}
                style={{
                  flex: 1, padding: "10px 0", textAlign: "center", cursor: "pointer",
                  background: i === activeStep ? pm.stepColors[i] + "20" : colors.bgSurface,
                  border: `1px solid ${i === activeStep ? pm.stepColors[i] + "60" : colors.bgBorder}`,
                  borderRadius: i === 0 ? `${radius.md} 0 0 ${radius.md}` : i === 2 ? `0 ${radius.md} ${radius.md} 0` : 0,
                  borderLeft: i > 0 ? "none" : undefined,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: i === activeStep ? pm.stepColors[i] : colors.textMuted, letterSpacing: "0.04em" }}>
                  STEP {i + 1}
                </div>
                <div style={{ fontSize: 11, color: i === activeStep ? colors.textPrimary : colors.textMuted, marginTop: 2 }}>
                  {s.timing}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── MAIN SPLIT LAYOUT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

          {/* LEFT — Step selector list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {customer.winBackSequence.map((step, i) => (
              <React.Fragment key={i}>
                <StepNode
                  step={step}
                  index={i}
                  isActive={activeStep === i}
                  color={pm.stepColors[i] || pm.color}
                  onClick={() => setActiveStep(i)}
                  visible={stepVisible[i]}
                />
                {i < customer.winBackSequence.length - 1 && (
                  <div style={{
                    width: 2, height: 16, background: colors.bgBorder,
                    margin: "0 auto",
                    borderRadius: 99,
                  }} />
                )}
              </React.Fragment>
            ))}

            {/* Sequence rationale */}
            <div style={{
              marginTop: 8, padding: "14px 16px",
              background: colors.bgSurface,
              border: `1px solid ${colors.bgBorder}`,
              borderRadius: radius.lg,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Sequence Logic
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Escalating commitment — each message earns the right to the next.", "Tone shifts match emotional arc of the customer.", "No discount until value is established (steps 1–2)."].map((txt, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: pm.color, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: colors.textMuted, lineHeight: 1.5 }}>{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Email preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Metadata strip */}
            <div style={{
              display: "flex", gap: 10, flexWrap: "wrap",
              animation: "fadeUp 0.3s ease",
            }}>
              {[
                { label: "Channel", value: "Email" },
                { label: "Send time", value: currentStep.timing },
                { label: "Tone", value: currentStep.tone },
                { label: "CTA type", value: currentStep.cta === "No CTA — just acknowledgment" ? "None" : "Link" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: "7px 12px",
                  background: colors.bgSurface,
                  border: `1px solid ${colors.bgBorder}`,
                  borderRadius: radius.md,
                  display: "flex", gap: 6, alignItems: "center",
                }}>
                  <span style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.textPrimary }}>{value}</span>
                </div>
              ))}

              {/* Copy button */}
              <button
                onClick={handleCopy}
                style={{
                  marginLeft: "auto",
                  padding: "7px 14px",
                  background: copied ? colors.accentTealDim : colors.bgSurface,
                  border: `1px solid ${copied ? colors.accentTeal + "50" : colors.bgBorder}`,
                  borderRadius: radius.md,
                  color: copied ? colors.accentTeal : colors.textMuted,
                  fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: fonts.body,
                  transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {copied ? "✓ Copied" : "⎘ Copy email"}
              </button>
            </div>

            {/* Email preview pane */}
            <EmailPreview
              step={currentStep}
              pm={pm}
              visible={true}
              key={activeStep}
            />

            {/* Step navigation */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                disabled={activeStep === 0}
                style={{
                  flex: 1, padding: "11px 0",
                  background: "none",
                  border: `1px solid ${colors.bgBorder}`,
                  borderRadius: radius.md,
                  color: activeStep === 0 ? colors.textMuted : colors.textSecondary,
                  fontWeight: 600, fontSize: 13, cursor: activeStep === 0 ? "default" : "pointer",
                  fontFamily: fonts.body, opacity: activeStep === 0 ? 0.4 : 1,
                }}
              >
                ← Previous
              </button>
              {activeStep < customer.winBackSequence.length - 1 ? (
                <button
                  onClick={() => setActiveStep(s => s + 1)}
                  style={{
                    flex: 2, padding: "11px 0",
                    background: `linear-gradient(135deg, ${stepColor}, ${stepColor}CC)`,
                    border: "none", borderRadius: radius.md,
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", fontFamily: fonts.body,
                    boxShadow: `0 0 16px ${stepColor}30`,
                  }}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={() => navigate("/analytics")}
                  style={{
                    flex: 2, padding: "11px 0",
                    background: `linear-gradient(135deg, ${pm.color}, ${pm.color}CC)`,
                    border: "none", borderRadius: radius.md,
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", fontFamily: fonts.body,
                    boxShadow: `0 0 20px ${pm.color}30`,
                  }}
                >
                  View Analytics →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}