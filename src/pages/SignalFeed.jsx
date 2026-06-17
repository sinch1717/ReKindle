import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, radius, shadows } from '../styles/theme.js';
import { customers, signalEvents } from '../data/customers.js';
import { Activity, Mail, ShoppingCart, MessageSquare, CreditCard, TrendingDown, Eye, Flag, ChevronRight } from 'lucide-react';

const THRESHOLD = 70;

function getEventIcon(type) {
  const map = {
    email: Mail,
    cart: ShoppingCart,
    support: MessageSquare,
    billing: CreditCard,
    browse: Eye,
    inactivity: TrendingDown,
    usage: TrendingDown,
    engagement: TrendingDown,
    flag: Flag,
  };
  return map[type] || Activity;
}

function getSeverityColor(severity) {
  if (severity === 'critical') return colors.accentRed;
  if (severity === 'high') return colors.accentAmber;
  if (severity === 'medium') return colors.textSecondary;
  return colors.textMuted;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// Starting scores before live feed
const initialScores = {
  c1: 72, c2: 55, c3: 52, c4: 61, c5: 58, c6: 47,
};

const scoreIncrements = {
  high: 5, medium: 3, low: 1, critical: 0,
};

export default function SignalFeed() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [scores, setScores] = useState(initialScores);
  const [flagged, setFlagged] = useState(new Set());
  const [justCrossed, setJustCrossed] = useState(new Set());
  const feedRef = useRef(null);
  const eventIndexRef = useRef(0);
  const startTime = useRef(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = eventIndexRef.current % signalEvents.length;
      const event = signalEvents[idx];
      eventIndexRef.current++;

      const now = new Date();
      const newEntry = { ...event, timestamp: formatTime(now), id: `${now.getTime()}-${idx}` };

      setFeed(prev => [newEntry, ...prev].slice(0, 40));

      setScores(prev => {
        const current = prev[event.customerId] ?? 50;
        const increment = scoreIncrements[event.severity] ?? 2;
        const newScore = Math.min(99, current + increment);

        const wasBelowThreshold = current < THRESHOLD;
        const nowAbove = newScore >= THRESHOLD;

        if (wasBelowThreshold && nowAbove) {
          setJustCrossed(p => {
            const next = new Set(p);
            next.add(event.customerId);
            return next;
          });
          setFlagged(p => {
            const next = new Set(p);
            next.add(event.customerId);
            return next;
          });
          setTimeout(() => {
            setJustCrossed(p => {
              const next = new Set(p);
              next.delete(event.customerId);
              return next;
            });
          }, 3000);
        }

        return { ...prev, [event.customerId]: newScore };
      });
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  const customerScores = customers.map(c => ({
    ...c,
    liveScore: scores[c.id] ?? c.riskScore,
    isFlagged: flagged.has(c.id) || scores[c.id] >= THRESHOLD,
    justCrossed: justCrossed.has(c.id),
  })).sort((a, b) => b.liveScore - a.liveScore);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left: Signal Feed */}
      <div style={{
        flex: '0 0 52%',
        borderRight: `1px solid ${colors.bgBorder}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: `1px solid ${colors.bgBorder}`,
          background: colors.bgSurface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: colors.accentTeal,
              boxShadow: `0 0 8px ${colors.accentTeal}`,
              animation: 'blink 1.4s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '16px', color: colors.textPrimary }}>
              Live Signal Feed
            </span>
          </div>
          <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.5 }}>
            Every behavioral event captured from your customer surface — in real time.
          </p>
        </div>

        {/* Feed */}
        <div ref={feedRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 0',
        }}>
          {feed.length === 0 && (
            <div style={{ padding: '40px 28px', color: colors.textMuted, fontSize: '13px' }}>
              Waiting for signals…
            </div>
          )}
          {feed.map((entry) => {
            const Icon = getEventIcon(entry.type);
            const isCritical = entry.severity === 'critical';
            return (
              <div key={entry.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 28px',
                borderBottom: `1px solid ${colors.bgBorder}20`,
                animation: 'slide-in-left 0.25s ease',
                background: isCritical ? `${colors.accentRed}08` : 'transparent',
                transition: 'background 0.3s',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: colors.textMuted, minWidth: '70px', paddingTop: '2px' }}>
                  {entry.timestamp}
                </span>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '4px',
                  background: `${getSeverityColor(entry.severity)}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '1px',
                }}>
                  <Icon size={11} color={getSeverityColor(entry.severity)} />
                </div>
                <div>
                  <span style={{
                    fontWeight: 600,
                    color: isCritical ? colors.accentRed : colors.textPrimary,
                    fontSize: '13px',
                  }}>{entry.customerName}</span>
                  <span style={{ color: colors.textSecondary, fontSize: '13px' }}> — {entry.event}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Risk Scoring Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: `1px solid ${colors.bgBorder}`,
          background: colors.bgSurface,
        }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '16px', color: colors.textPrimary, marginBottom: '6px' }}>
            Risk Scoring Engine
          </div>
          <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.5 }}>
            Scores update with each signal. Customers crossing {THRESHOLD} are flagged automatically.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {customerScores.map(c => {
            const pct = Math.min(100, (c.liveScore / 100) * 100);
            const isFlagged = c.isFlagged;
            const isNew = c.justCrossed;
            const barColor = c.liveScore >= 85 ? colors.accentRed : c.liveScore >= THRESHOLD ? colors.accentAmber : colors.accentTeal;

            return (
              <div key={c.id} style={{
                padding: '14px 16px',
                borderRadius: radius.md,
                background: isNew ? `${colors.accentRed}12` : isFlagged ? `${colors.accentRed}06` : colors.bgSurface,
                border: `1px solid ${isNew ? colors.accentRed : isFlagged ? `${colors.accentRed}40` : colors.bgBorder}`,
                transition: 'all 0.4s ease',
                boxShadow: isNew ? shadows.redGlow : 'none',
                animation: isNew ? 'threshold-cross 0.8s ease' : 'none',
                cursor: isFlagged ? 'pointer' : 'default',
              }}
              onClick={() => isFlagged && navigate(`/diagnosis/${c.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${colors.bgElevated}, ${colors.bgBorder})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700, color: colors.textSecondary,
                    }}>{c.avatar}</div>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: colors.textPrimary }}>{c.name}</span>
                    {isFlagged && (
                      <span style={{
                        fontSize: '9px', fontWeight: 700,
                        color: colors.accentRed,
                        background: colors.accentRedDim,
                        padding: '2px 6px',
                        borderRadius: radius.full,
                        letterSpacing: '0.05em',
                        animation: isNew ? 'pulse-ring 1.5s ease 3' : 'none',
                      }}>FLAGGED</span>
                    )}
                    {isNew && (
                      <span style={{
                        fontSize: '9px', fontWeight: 700,
                        color: colors.accentRed,
                        animation: 'blink 0.5s ease 6',
                      }}>← just crossed threshold</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: fonts.display,
                      fontWeight: 800,
                      fontSize: '18px',
                      color: barColor,
                      minWidth: '30px',
                      textAlign: 'right',
                    }}>{c.liveScore}</span>
                    {isFlagged && <ChevronRight size={14} color={colors.textMuted} />}
                  </div>
                </div>

                {/* Score bar */}
                <div style={{
                  height: '5px',
                  background: colors.bgElevated,
                  borderRadius: radius.full,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {/* Threshold marker */}
                  <div style={{
                    position: 'absolute',
                    left: `${THRESHOLD}%`,
                    top: '-2px',
                    width: '1px',
                    height: '9px',
                    background: colors.textMuted,
                    zIndex: 2,
                    opacity: 0.5,
                  }} />
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
                    borderRadius: radius.full,
                    transition: 'width 0.6s ease',
                    boxShadow: isFlagged ? `0 0 8px ${barColor}60` : 'none',
                  }} />
                </div>

                {isFlagged && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: colors.textMuted }}>
                    Click to diagnose →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.bgBorder}`,
          background: colors.bgSurface,
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: radius.md,
              background: `linear-gradient(135deg, ${colors.accentRed}, #C1384F)`,
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              border: 'none',
              fontFamily: fonts.body,
            }}
          >
            View all flagged customers →
          </button>
        </div>
      </div>
    </div>
  );
}