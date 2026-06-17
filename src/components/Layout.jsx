import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { colors, fonts, radius } from '../styles/theme.js';
import { Activity, LayoutDashboard, BarChart3, Flame } from 'lucide-react';

const navItems = [
  { to: '/signals', label: 'Signal Feed', icon: Activity, badge: 'LIVE' },
  { to: '/dashboard', label: 'At-Risk Customers', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/simulator', label: 'Extension Simulator', icon: Flame }
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: colors.bgBase }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: colors.bgSurface,
        borderRight: `1px solid ${colors.bgBorder}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: `1px solid ${colors.bgBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: radius.md,
              background: `linear-gradient(135deg, ${colors.accentRed}, #C1384F)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 16px ${colors.accentRedGlow}`,
            }}>
              <Flame size={16} color="#fff" />
            </div>
            <span style={{
              fontFamily: fonts.display,
              fontWeight: 800,
              fontSize: '17px',
              color: colors.textPrimary,
              letterSpacing: '-0.3px',
            }}>ReKindle</span>
          </div>
          <div style={{
            marginTop: '6px',
            fontSize: '11px',
            color: colors.textMuted,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>Win-back intelligence</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} style={{ display: 'block', textDecoration: 'none', marginBottom: '4px' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px',
                  borderRadius: radius.md,
                  background: isActive ? colors.bgElevated : 'transparent',
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  border: isActive ? `1px solid ${colors.bgBorder}` : '1px solid transparent',
                  position: 'relative',
                }}>
                  <Icon size={15} color={isActive ? colors.accentRed : colors.textMuted} />
                  {label}
                  {badge && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: colors.accentTeal,
                      background: colors.accentTealDim,
                      padding: '2px 5px',
                      borderRadius: radius.full,
                      letterSpacing: '0.05em',
                    }}>{badge}</span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.bgBorder}`,
          fontSize: '11px',
          color: colors.textMuted,
        }}>
          <div style={{ fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>Demo Mode</div>
          <div>Signals simulated in real time</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: colors.bgBase,
      }}>
        <Outlet />
      </main>
    </div>
  );
}