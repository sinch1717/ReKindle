// ─────────────────────────────────────────────────────────────────────────────
// REKINDLE DESIGN TOKENS
// All colors, fonts, and spacing live here.
// Change anything here and it propagates everywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bgBase: '#0A0F1E',        // deepest background — the "void" layer
  bgSurface: '#111827',     // card / panel surface
  bgElevated: '#1A2235',    // hover states, elevated cards
  bgBorder: '#1E2A3A',      // borders and dividers

  // Accent — danger / churn / urgency
  accentRed: '#FF4D6D',
  accentRedDim: '#FF4D6D22',
  accentRedGlow: '#FF4D6D44',

  // Accent — recovery / teal / positive
  accentTeal: '#00E5BF',
  accentTealDim: '#00E5BF18',
  accentTealGlow: '#00E5BF33',

  // Accent — warning / amber
  accentAmber: '#FFB547',
  accentAmberDim: '#FFB54720',

  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#A8B4C8',
  textMuted: '#566070',
  textInverse: '#0A0F1E',

  // Risk score colors
  riskHigh: '#FF4D6D',
  riskMedium: '#FFB547',
  riskLow: '#00E5BF',

  // Profile archetype colors
  profileFrustrated: '#FF4D6D',
  profilePriceSensitive: '#FFB547',
  profileGoneQuiet: '#00E5BF',
};

export const fonts = {
  display: "'Montserrat', sans-serif",   // headings, hero text
  body: "'Inter', sans-serif",           // everything else
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(30,42,58,0.8)',
  glow: (color) => `0 0 20px ${color}40, 0 0 40px ${color}20`,
  redGlow: '0 0 20px #FF4D6D33, 0 0 40px #FF4D6D18',
  tealGlow: '0 0 20px #00E5BF33, 0 0 40px #00E5BF18',
};

// Inline style helpers for consistent card styles
export const cardStyle = {
  background: colors.bgSurface,
  border: `1px solid ${colors.bgBorder}`,
  borderRadius: radius.lg,
};