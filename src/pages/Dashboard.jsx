import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { customers, analyticsData } from "../data/customers";
import { colors, fonts, radius, shadows } from "../styles/theme";

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE META
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_META = {
  frustrated:     { label: "Frustrated",      icon: "😤", color: colors.accentRed,   dim: colors.accentRedDim,   border: `${colors.accentRed}40`   },
  price_sensitive:{ label: "Price-Sensitive", icon: "💸", color: colors.accentAmber, dim: colors.accentAmberDim, border: `${colors.accentAmber}40` },
  gone_quiet:     { label: "Gone Quiet",      icon: "🤫", color: colors.accentTeal,  dim: colors.accentTealDim,  border: `${colors.accentTeal}40`  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE — risk score trend (simulated)
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ score, color, width = 64, height = 24 }) {
  // Generate a plausible recent trend ending at `score`
  const points = React.useMemo(() => {
    const pts = [];
    let v = Math.max(10, score - 30 - Math.random() * 15);
    for (let i = 0; i < 8; i++) {
      v = Math.min(99, Math.max(5, v + (Math.random() - 0.3) * 12));
      pts.push(v);
    }
    pts.push(score);
    return pts;
  }, [score]);

  const max = Math.max(...points, 100);
  const svgPts = points.map((v, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <polyline
        points={svgPts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* End dot */}
      {(() => {
        const last = points[points.length - 1];
        const x = width;
        const y = height - (last / max) * height;
        return <circle cx={x} cy={y} r={2.5} fill={color} />;
      })()}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE BAR
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score >= 85 ? colors.accentRed : score >= 70 ? colors.accentAmber : colors.accentTeal;
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(score), 100); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 4, background: colors.bgBorder, borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`,
          background: color, borderRadius: 99,
          transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 6px ${color}60`,
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: fonts.display, minWidth: 24 }}>{score}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNT-UP STAT
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({ target, prefix = "", suffix = "", color }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 800;
    const num = parseFloat(String(target).replace(/[^0-9.]/g, ""));
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(eased * num * 10) / 10);
      if (pct < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [target]);
  const display = Number.isInteger(parseFloat(String(target).replace(/[^0-9.]/g, ""))) ? Math.round(val) : val.toFixed(1);
  return <span style={{ color: color || colors.textPrimary }}>{prefix}{display}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, prefix, suffix, sub, color, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      flex: 1, padding: "20px 20px",
      background: colors.bgSurface,
      border: `1px solid ${colors.bgBorder}`,
      borderRadius: radius.lg,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: fonts.display, letterSpacing: "-1px", lineHeight: 1, marginBottom: 6 }}>
        <CountUp target={value} prefix={prefix} suffix={suffix} color={color} />
      </div>
      {sub && <div style={{ fontSize: 11, color: colors.textMuted }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK TIER LEGEND PILL
// ─────────────────────────────────────────────────────────────────────────────
function TierPill({ color, label, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: 11, color: colors.textMuted }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>{count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER ROW
// ─────────────────────────────────────────────────────────────────────────────
function CustomerRow({ customer, index, onClick }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const pm = PROFILE_META[customer.profile] || PROFILE_META.gone_quiet;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60 + 200);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "200px 110px 90px 100px 90px 1fr 80px",
        alignItems: "center",
        gap: 12,
        padding: "13px 20px",
        borderBottom: `1px solid ${colors.bgBorder}`,
        cursor: "pointer",
        background: hovered ? colors.bgElevated : "transparent",
        transition: "background 0.15s ease, opacity 0.3s ease, transform 0.3s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
      }}
    >
      {/* Name + email */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${pm.color}30, ${pm.color}10)`,
          border: `1px solid ${pm.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: pm.color,
        }}>{customer.avatar}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.name}</div>
          <div style={{ fontSize: 10, color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.email}</div>
        </div>
      </div>

      {/* Profile badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 8px", borderRadius: radius.full,
        background: pm.dim, border: `1px solid ${pm.border}`,
        fontSize: 10, fontWeight: 700, color: pm.color,
        whiteSpace: "nowrap",
      }}>
        <span>{pm.icon}</span>
        <span>{pm.label}</span>
      </div>

      {/* Risk score + bar */}
      <ScoreBar score={customer.riskScore} />

      {/* LTV */}
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>{customer.totalSpend}</div>

      {/* Inactive days */}
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: customer.daysSincePurchase > 60 ? colors.accentRed : customer.daysSincePurchase > 30 ? colors.accentAmber : colors.textSecondary,
      }}>{customer.daysSincePurchase}d ago</div>

      {/* Sparkline */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Sparkline score={customer.riskScore} color={customer.riskScore >= 85 ? colors.accentRed : customer.riskScore >= 70 ? colors.accentAmber : colors.accentTeal} />
      </div>

      {/* CTA */}
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: hovered ? pm.color : colors.textMuted,
        textAlign: "right",
        transition: "color 0.15s ease",
      }}>
        Diagnose →
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOVERY RATE BAR — segment performance
// ─────────────────────────────────────────────────────────────────────────────
function RecoveryBar({ profile, sent, recovered, rate, delay }) {
  const pm = Object.values(PROFILE_META).find(p => p.label === profile) || PROFILE_META.gone_quiet;
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(rate), delay); return () => clearTimeout(t); }, [rate, delay]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>{pm.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>{profile}</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 11, color: colors.textMuted }}>{recovered}/{sent}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pm.color }}>{rate}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: colors.bgBorder, borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`,
          background: pm.color, borderRadius: 99,
          transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 8px ${pm.color}50`,
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");

  const highRisk   = customers.filter(c => c.riskScore >= 85);
  const medRisk    = customers.filter(c => c.riskScore >= 70 && c.riskScore < 85);
  const flagged    = customers.filter(c => c.riskScore >= 70);
  const avgRisk    = Math.round(customers.reduce((a, b) => a + b.riskScore, 0) / customers.length);

  const filtered = customers
    .filter(c => filter === "all" ? true : c.profile === filter)
    .sort((a, b) => sortBy === "risk" ? b.riskScore - a.riskScore : b.daysSincePurchase - a.daysSincePurchase);

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bgBase,
      fontFamily: fonts.body,
      color: colors.textPrimary,
      padding: "28px 32px 60px",
    }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: fonts.display }}>
            Customer Dashboard
          </h1>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
            Monitoring {customers.length} customers · Last updated just now
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.accentTeal, boxShadow: `0 0 6px ${colors.accentTeal}` }} />
          <span style={{ fontSize: 11, color: colors.accentTeal, fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
        <StatCard label="Monitored" value={customers.length} sub="active customers" delay={0} />
        <StatCard label="High Risk" value={highRisk.length} color={colors.accentRed} sub="score ≥ 85" delay={60} />
        <StatCard label="Flagged" value={flagged.length} color={colors.accentAmber} sub="threshold crossed" delay={120} />
        <StatCard label="Avg Risk Score" value={avgRisk} color={avgRisk >= 70 ? colors.accentAmber : colors.accentTeal} sub="across all customers" delay={180} />
        <StatCard label="Revenue at Risk" value="9760" prefix="$" sub="estimated churn value" color={colors.accentRed} delay={240} />
      </div>

      {/* ── TWO COLUMN ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

        {/* LEFT — customer table */}
        <div style={{ background: colors.bgSurface, border: `1px solid ${colors.bgBorder}`, borderRadius: radius.lg, overflow: "hidden" }}>

          {/* Table header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.bgBorder}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>At-Risk Customers</span>
              <div style={{ display: "flex", gap: 12 }}>
                <TierPill color={colors.accentRed}   label="Critical" count={highRisk.length} />
                <TierPill color={colors.accentAmber} label="Elevated" count={medRisk.length} />
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Profile filter */}
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { key: "all", label: "All" },
                  { key: "frustrated", label: "😤" },
                  { key: "price_sensitive", label: "💸" },
                  { key: "gone_quiet", label: "🤫" },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{
                    padding: "4px 10px", borderRadius: radius.md, cursor: "pointer",
                    fontFamily: fonts.body, fontSize: 11, fontWeight: filter === f.key ? 700 : 400,
                    background: filter === f.key ? colors.bgElevated : "transparent",
                    color: filter === f.key ? colors.textPrimary : colors.textMuted,
                    border: filter === f.key ? `1px solid ${colors.bgBorder}` : "1px solid transparent",
                  }}>{f.label}</button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: "4px 8px", borderRadius: radius.md,
                  background: colors.bgElevated, border: `1px solid ${colors.bgBorder}`,
                  color: colors.textSecondary, fontSize: 11, fontFamily: fonts.body, cursor: "pointer",
                }}
              >
                <option value="risk">Sort: Risk ↓</option>
                <option value="inactive">Sort: Inactive ↓</option>
              </select>
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "200px 110px 90px 100px 90px 1fr 80px",
            gap: 12,
            padding: "9px 20px",
            borderBottom: `1px solid ${colors.bgBorder}`,
            background: colors.bgBase,
          }}>
            {["Customer", "Profile", "Risk", "LTV", "Last Active", "Trend", ""].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((c, i) => (
            <CustomerRow
              key={c.id}
              customer={c}
              index={i}
              onClick={() => navigate(`/diagnosis/${c.id}`)}
            />
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
              No customers match this filter.
            </div>
          )}
        </div>

        {/* RIGHT — sidebar panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Recovery snapshot */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.bgBorder}`,
            borderRadius: radius.lg,
            padding: "18px 18px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Recovery Snapshot
            </div>

            {/* Hero stat */}
            <div style={{
              padding: "14px 16px",
              background: colors.accentTealDim,
              border: `1px solid ${colors.accentTeal}30`,
              borderRadius: radius.md,
              marginBottom: 14,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: fonts.display, color: colors.accentTeal }}>
                  {analyticsData.revenueRecovered}
                </div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>recovered this month</div>
              </div>
              <div style={{ fontSize: 28 }}>💰</div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Rate", value: `${analyticsData.recoveryRate}%`, color: colors.accentTeal },
                { label: "Campaigns", value: analyticsData.sentThisMonth },
                { label: "Avg days", value: analyticsData.avgTimeToRecover },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, padding: "10px 10px", textAlign: "center",
                  background: colors.bgElevated, borderRadius: radius.md,
                  border: `1px solid ${colors.bgBorder}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color || colors.textPrimary, fontFamily: fonts.display }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* By segment */}
            <div style={{ borderTop: `1px solid ${colors.bgBorder}`, paddingTop: 14 }}>
              <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                By Segment
              </div>
              {analyticsData.byProfile.map((p, i) => (
                <RecoveryBar key={p.profile} {...p} delay={i * 100 + 400} />
              ))}
            </div>
          </div>

          {/* Recent wins */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.bgBorder}`,
            borderRadius: radius.lg,
            padding: "18px 18px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Recent Wins
            </div>
            {analyticsData.recentWins.map((w, i) => {
              const pm = PROFILE_META[w.profile] || PROFILE_META.gone_quiet;
              return (
                <div key={w.name} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: i < analyticsData.recentWins.length - 1 ? `1px solid ${colors.bgBorder}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{pm.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>{w.name}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>{w.days}d to recover</div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: colors.accentTeal,
                    background: colors.accentTealDim,
                    padding: "3px 9px", borderRadius: radius.full,
                    border: `1px solid ${colors.accentTeal}30`,
                  }}>{w.amount}</div>
                </div>
              );
            })}
          </div>

          {/* Quick action */}
          <button
            onClick={() => navigate("/analytics")}
            style={{
              width: "100%", padding: "12px 0",
              background: "none",
              border: `1px solid ${colors.bgBorder}`,
              borderRadius: radius.lg,
              color: colors.textMuted, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: fonts.body,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accentTeal + "50"; e.currentTarget.style.color = colors.accentTeal; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.bgBorder; e.currentTarget.style.color = colors.textMuted; }}
          >
            View Full Analytics →
          </button>
        </div>
      </div>
    </div>
  );
}