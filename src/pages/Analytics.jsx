import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend
} from "recharts";
import { analyticsData, customers } from "../data/customers";
import { colors, fonts, radius } from "../styles/theme";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK TIME-SERIES DATA — last 30 days
// ─────────────────────────────────────────────────────────────────────────────
const DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

const rand = seedRand(42);
const timeSeriesData = DAYS.map((day, i) => {
  const base = 8 + Math.floor(i * 0.6);
  const frustrated   = Math.round(base * (0.9 + rand() * 0.5));
  const priceSensitive = Math.round(base * (0.7 + rand() * 0.4));
  const goneQuiet    = Math.round(base * (0.6 + rand() * 0.3));
  const sent         = frustrated + priceSensitive + goneQuiet;
  const recovered    = Math.round(sent * (0.28 + rand() * 0.18));
  const revenue      = recovered * (80 + Math.floor(rand() * 100));
  return { day, sent, recovered, frustrated, priceSensitive, goneQuiet, revenue, rate: Math.round((recovered / sent) * 100) };
});

const PROFILE_META = {
  frustrated:      { label: "Frustrated",       icon: "😤", color: colors.accentRed,   dim: colors.accentRedDim,   border: `${colors.accentRed}40`   },
  price_sensitive: { label: "Price-Sensitive",   icon: "💸", color: colors.accentAmber, dim: colors.accentAmberDim, border: `${colors.accentAmber}40` },
  gone_quiet:      { label: "Gone Quiet",        icon: "🤫", color: colors.accentTeal,  dim: colors.accentTealDim,  border: `${colors.accentTeal}40`  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNT-UP
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({ target, prefix = "", suffix = "", color, size = 32, decimals = 0 }) {
  const [val, setVal] = useState(0);
  const num = parseFloat(String(target).replace(/[^0-9.]/g, ""));
  useEffect(() => {
    let start = null;
    const dur = 900;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setVal(eased * num);
      if (pct < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [num]);
  return (
    <span style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: size, color: color || colors.textPrimary, letterSpacing: "-1px", lineHeight: 1 }}>
      {prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, prefix, suffix, sub, color, delta, delay = 0, decimals = 0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      flex: 1, padding: "20px",
      background: colors.bgSurface,
      border: `1px solid ${colors.bgBorder}`,
      borderRadius: radius.lg,
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      <div style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{label}</div>
      <CountUp target={value} prefix={prefix} suffix={suffix} color={color} size={30} decimals={decimals} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        {delta && (
          <span style={{ fontSize: 10, fontWeight: 700, color: colors.accentTeal, background: colors.accentTealDim, padding: "2px 6px", borderRadius: 99 }}>
            {delta}
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: colors.textMuted }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, valueKey = "value", prefix = "", suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: colors.bgElevated,
      border: `1px solid ${colors.bgBorder}`,
      borderRadius: radius.md,
      padding: "10px 14px",
      fontSize: 12,
      fontFamily: fonts.body,
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      <div style={{ color: colors.textMuted, marginBottom: 6, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill }} />
          <span style={{ color: colors.textSecondary }}>{p.name}:</span>
          <span style={{ color: colors.textPrimary, fontWeight: 700 }}>{prefix}{p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: radius.md,
      background: active ? colors.bgElevated : "transparent",
      border: active ? `1px solid ${colors.bgBorder}` : "1px solid transparent",
      color: active ? colors.textPrimary : colors.textMuted,
      fontSize: 12, fontWeight: active ? 700 : 400,
      cursor: "pointer", fontFamily: fonts.body,
      transition: "all 0.15s ease",
    }}>{label}</button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const navigate = useNavigate();
  const [chartTab, setChartTab] = useState("recovery");   // recovery | revenue | segments
  const [windowDays, setWindowDays] = useState(14);
  const [vis, setVis] = useState(false);

  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);

  const slicedData = timeSeriesData.slice(-windowDays);
  const totalRevenue = slicedData.reduce((a, b) => a + b.revenue, 0);
  const totalRecovered = slicedData.reduce((a, b) => a + b.recovered, 0);
  const avgRate = Math.round(slicedData.reduce((a, b) => a + b.rate, 0) / slicedData.length);

  // Segment bar chart data
  const segmentData = analyticsData.byProfile.map(p => ({
    name: p.profile,
    Sent: p.sent,
    Recovered: p.recovered,
    Rate: p.rate,
  }));

  const axisStyle = { fill: colors.textMuted, fontSize: 10, fontFamily: fonts.body };

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bgBase,
      fontFamily: fonts.body,
      color: colors.textPrimary,
      padding: "28px 32px 60px",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 28,
        opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: fonts.display }}>
            Recovery Analytics
          </h1>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
            Win-back performance · last {windowDays} days
          </div>
        </div>
        {/* Window selector */}
        <div style={{ display: "flex", gap: 4, background: colors.bgSurface, border: `1px solid ${colors.bgBorder}`, borderRadius: radius.md, padding: 4 }}>
          {[7, 14, 30].map(d => (
            <Tab key={d} label={`${d}d`} active={windowDays === d} onClick={() => setWindowDays(d)} />
          ))}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
        <StatCard
          label="Revenue Recovered"
          value={totalRevenue}
          prefix="$"
          sub="in selected window"
          color={colors.accentTeal}
          delta="↑ 12% vs prior"
          delay={0}
        />
        <StatCard
          label="Customers Recovered"
          value={totalRecovered}
          sub="win-backs completed"
          color={colors.accentTeal}
          delta="↑ 8%"
          delay={60}
        />
        <StatCard
          label="Recovery Rate"
          value={avgRate}
          suffix="%"
          sub="avg across window"
          color={avgRate >= 40 ? colors.accentTeal : colors.accentAmber}
          delay={120}
        />
        <StatCard
          label="Campaigns Sent"
          value={analyticsData.sentThisMonth}
          sub="this month total"
          delay={180}
        />
        <StatCard
          label="Avg Days to Recover"
          value={9.2}
          suffix="d"
          sub="median recovery time"
          color={colors.accentAmber}
          delay={240}
          decimals={1}
        />
      </div>

      {/* ── MAIN CHART + SIDEBAR ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 20 }}>

        {/* LEFT — main chart panel */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.bgBorder}`,
          borderRadius: radius.lg,
          padding: "22px 20px",
          animation: "fadeUp 0.4s ease 0.1s both",
        }}>
          {/* Chart tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <SectionHeader
              title={chartTab === "recovery" ? "Recovery Rate — Daily" : chartTab === "revenue" ? "Revenue Recovered — Daily" : "Campaigns by Segment"}
              sub={chartTab === "segments" ? "Sent vs recovered per archetype" : `Last ${windowDays} days`}
            />
            <div style={{ display: "flex", gap: 4 }}>
              <Tab label="Recovery %" active={chartTab === "recovery"} onClick={() => setChartTab("recovery")} />
              <Tab label="Revenue"    active={chartTab === "revenue"}  onClick={() => setChartTab("revenue")}  />
              <Tab label="Segments"   active={chartTab === "segments"} onClick={() => setChartTab("segments")} />
            </div>
          </div>

          {/* RECOVERY RATE CHART */}
          {chartTab === "recovery" && (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={slicedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={colors.accentTeal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.accentTeal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.bgBorder} vertical={false} />
                <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={false} interval={Math.floor(windowDays / 5)} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit="%" domain={[0, 70]} />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Area
                  type="monotone" dataKey="rate" name="Rate"
                  stroke={colors.accentTeal} strokeWidth={2}
                  fill="url(#rateGrad)"
                  dot={false} activeDot={{ r: 4, fill: colors.accentTeal, stroke: colors.bgBase, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* REVENUE CHART */}
          {chartTab === "revenue" && (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={slicedData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={colors.accentAmber} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.accentAmber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.bgBorder} vertical={false} />
                <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={false} interval={Math.floor(windowDays / 5)} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip content={<ChartTooltip prefix="$" />} />
                <Area
                  type="monotone" dataKey="revenue" name="Revenue"
                  stroke={colors.accentAmber} strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false} activeDot={{ r: 4, fill: colors.accentAmber, stroke: colors.bgBase, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* SEGMENTS CHART */}
          {chartTab === "segments" && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={segmentData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.bgBorder} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Sent" name="Sent" radius={[4, 4, 0, 0]}>
                  {segmentData.map((_, i) => (
                    <Cell key={i} fill={[colors.accentRed, colors.accentAmber, colors.accentTeal][i] + "40"} />
                  ))}
                </Bar>
                <Bar dataKey="Recovered" name="Recovered" radius={[4, 4, 0, 0]}>
                  {segmentData.map((_, i) => (
                    <Cell key={i} fill={[colors.accentRed, colors.accentAmber, colors.accentTeal][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Mini legend for recovery chart */}
          {chartTab === "recovery" && (
            <div style={{ display: "flex", gap: 20, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.bgBorder}` }}>
              {[
                { label: "Avg this period", value: `${avgRate}%`, color: colors.accentTeal },
                { label: "Best day", value: `${Math.max(...slicedData.map(d => d.rate))}%`, color: colors.accentTeal },
                { label: "Total recovered", value: totalRecovered, color: colors.textSecondary },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: fonts.display, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {chartTab === "revenue" && (
            <div style={{ display: "flex", gap: 20, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.bgBorder}` }}>
              {[
                { label: "Total this period", value: `$${(totalRevenue / 1000).toFixed(1)}k`, color: colors.accentAmber },
                { label: "Best day", value: `$${Math.max(...slicedData.map(d => d.revenue)).toLocaleString()}`, color: colors.accentAmber },
                { label: "Avg per win-back", value: `$${Math.round(totalRevenue / totalRecovered)}`, color: colors.textSecondary },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: fonts.display, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — segment breakdown */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.bgBorder}`,
          borderRadius: radius.lg,
          padding: "22px 18px",
          animation: "fadeUp 0.4s ease 0.15s both",
        }}>
          <SectionHeader title="Segment Performance" sub="Recovery rate by archetype" />

          {analyticsData.byProfile.map((p, i) => {
            const profileKey = p.profile.toLowerCase().replace("-", "_").replace(" ", "_");
            const pm = Object.values(PROFILE_META).find(m => m.label === p.profile) || PROFILE_META.gone_quiet;
            const [barW, setBarW] = useState(0);
            useEffect(() => { const t = setTimeout(() => setBarW(p.rate), 300 + i * 120); return () => clearTimeout(t); }, []);

            return (
              <div key={p.profile} style={{
                padding: "14px 14px",
                background: colors.bgElevated,
                borderRadius: radius.md,
                border: `1px solid ${colors.bgBorder}`,
                marginBottom: i < analyticsData.byProfile.length - 1 ? 10 : 0,
              }}>
                {/* Profile label */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>{pm.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>{p.profile}</span>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 800, fontFamily: fonts.display, color: pm.color,
                  }}>{p.rate}%</span>
                </div>

                {/* Rate bar */}
                <div style={{ height: 6, background: colors.bgBorder, borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{
                    height: "100%", width: `${barW}%`,
                    background: pm.color, borderRadius: 99,
                    transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                    boxShadow: `0 0 8px ${pm.color}50`,
                  }} />
                </div>

                {/* Sent / recovered */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1, textAlign: "center", padding: "7px 0", background: colors.bgBase, borderRadius: radius.sm }}>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: fonts.display, color: colors.textSecondary }}>{p.sent}</div>
                    <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sent</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", padding: "7px 0", background: pm.dim, border: `1px solid ${pm.border}`, borderRadius: radius.sm }}>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: fonts.display, color: pm.color }}>{p.recovered}</div>
                    <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Won back</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total headline */}
          <div style={{
            marginTop: 14, padding: "12px 14px",
            background: colors.accentTealDim,
            border: `1px solid ${colors.accentTeal}30`,
            borderRadius: radius.md,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>Overall rate</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: fonts.display, color: colors.accentTeal }}>
                {analyticsData.recoveryRate}%
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>Revenue</div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: fonts.display, color: colors.accentTeal }}>
                {analyticsData.revenueRecovered}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: campaign volume + recent wins ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

        {/* Campaign volume by segment — stacked area */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.bgBorder}`,
          borderRadius: radius.lg,
          padding: "22px 20px",
          animation: "fadeUp 0.4s ease 0.2s both",
        }}>
          <SectionHeader title="Campaign Volume by Archetype" sub={`Daily sends — last ${windowDays} days`} />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={slicedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {[
                  { id: "frustGrad", color: colors.accentRed },
                  { id: "priceGrad", color: colors.accentAmber },
                  { id: "quietGrad", color: colors.accentTeal },
                ].map(g => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={g.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={g.color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.bgBorder} vertical={false} />
              <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={false} interval={Math.floor(windowDays / 5)} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="frustrated"    name="Frustrated"     stroke={colors.accentRed}   strokeWidth={1.5} fill="url(#frustGrad)" dot={false} stackId="1" />
              <Area type="monotone" dataKey="priceSensitive" name="Price-Sensitive" stroke={colors.accentAmber} strokeWidth={1.5} fill="url(#priceGrad)" dot={false} stackId="1" />
              <Area type="monotone" dataKey="goneQuiet"     name="Gone Quiet"     stroke={colors.accentTeal}  strokeWidth={1.5} fill="url(#quietGrad)" dot={false} stackId="1" />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
            {[
              { label: "Frustrated",     color: colors.accentRed   },
              { label: "Price-Sensitive", color: colors.accentAmber },
              { label: "Gone Quiet",     color: colors.accentTeal  },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                <span style={{ fontSize: 11, color: colors.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent wins */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.bgBorder}`,
          borderRadius: radius.lg,
          padding: "22px 18px",
          animation: "fadeUp 0.4s ease 0.25s both",
        }}>
          <SectionHeader title="Recent Wins" sub="Latest recovered customers" />

          {analyticsData.recentWins.map((w, i) => {
            const pm = PROFILE_META[w.profile] || PROFILE_META.gone_quiet;
            return (
              <div key={w.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 0",
                borderBottom: i < analyticsData.recentWins.length - 1 ? `1px solid ${colors.bgBorder}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: pm.dim, border: `1px solid ${pm.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13,
                  }}>{pm.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>{w.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: pm.color, fontWeight: 700 }}>{pm.label}</span>
                      <span style={{ fontSize: 10, color: colors.textMuted }}>· {w.days}d</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 800, fontFamily: fonts.display,
                  color: colors.accentTeal,
                  background: colors.accentTealDim,
                  padding: "4px 10px", borderRadius: radius.full,
                  border: `1px solid ${colors.accentTeal}30`,
                }}>{w.amount}</div>
              </div>
            );
          })}

          {/* Footer CTA */}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              width: "100%", marginTop: 14,
              padding: "11px 0",
              background: "none",
              border: `1px solid ${colors.bgBorder}`,
              borderRadius: radius.md,
              color: colors.textMuted, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: fonts.body,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accentTeal + "50"; e.currentTarget.style.color = colors.accentTeal; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.bgBorder; e.currentTarget.style.color = colors.textMuted; }}
          >
            View At-Risk Customers →
          </button>
        </div>
      </div>
    </div>
  );
}