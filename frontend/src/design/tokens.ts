// /src/design/tokens.ts
// ✅ PRODUCTION-READY LUXURY DESIGN TOKEN SYSTEM

export const tokens = {
  // LIGHT MODE - Primary Color System
  light: {
    // Base Colors
    bg: {
      primary: '#FFFFFF',
      secondary: '#FAF7F2',
      soft: '#F3EFE8',
      card: '#FFFFFF',
    },
    // Accent Colors
    accent: {
      gold: '#C6A75E',
      deepGold: '#A8893D',
      rose: '#B76E79',
      maroon: '#7A1F3D',
    },
    // Text Colors
    text: {
      primary: '#1E1E1E',
      secondary: '#5C5C5C',
      muted: '#8E8E8E',
    },
    // Border Colors
    border: {
      light: '#E8E2D8',
      soft: '#F1ECE3',
    },
    // State Colors
    states: {
      success: '#2F6F4E',
      error: '#A94442',
      warning: '#C67C2E',
    },
  },

  // DARK MODE - Soft Textile Dark (No Pure Black)
  dark: {
    // Base Colors (No pure black)
    bg: {
      primary: '#1A1816',
      secondary: '#22201D',
      soft: '#2B2926',
      card: '#2B2926',
    },
    // Accent Colors (Warmer in dark mode)
    accent: {
      gold: '#D8B96E',
      deepGold: '#C6A75E',
      rose: '#B76E79',
      maroon: '#A84C61',
    },
    // Text Colors
    text: {
      primary: '#F5F1EA',
      secondary: '#D4CDBF',
      muted: '#9E9998',
    },
    // Border Colors
    border: {
      light: '#3A3632',
      soft: '#32302D',
    },
    // State Colors
    states: {
      success: '#3FAD6F',
      error: '#C05C5C',
      warning: '#D99C4E',
    },
  },

  // SPACING SCALE - Breathing Space
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  // BORDER RADIUS SCALE - Soft Corners
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // TYPOGRAPHY SCALE - Serif Headers + Sans Body
  typography: {
    h1: {
      fontSize: '48px',
      fontWeight: '700',
      letterSpacing: '-0.02em',
      lineHeight: '1.2',
      fontFamily: '"Playfair Display", serif',
    },
    h2: {
      fontSize: '36px',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      lineHeight: '1.3',
      fontFamily: '"Playfair Display", serif',
    },
    h3: {
      fontSize: '28px',
      fontWeight: '600',
      letterSpacing: '-0.01em',
      lineHeight: '1.3',
      fontFamily: '"Playfair Display", serif',
    },
    h4: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.4',
      fontFamily: '"Playfair Display", serif',
    },
    body: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.6',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    bodySmall: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    caption: {
      fontSize: '12px',
      fontWeight: '400',
      lineHeight: '1.4',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  },

  // TRANSITIONS - Subtle and Responsive
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // SHADOWS - Minimal, Not Heavy
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.12)',
    none: 'none',
  },
} as const;

export type TokensType = typeof tokens;

// Helper function to get theme colors
export const getColors = (isDark: boolean) => {
  return isDark ? tokens.dark : tokens.light;
};