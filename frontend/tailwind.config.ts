// /frontend/tailwind.config.ts
// ✅ PRODUCTION-READY LUXURY TAILWIND CONFIG

import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate'; 

export default {
  darkMode: 'class', // Class-based dark mode for .dark selector
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: 'var(--spacing-lg)',
        sm: 'var(--spacing-xl)',
        md: 'var(--spacing-2xl)',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // COLOR SYSTEM - All CSS variables
      colors: {
        // Base Colors
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          soft: 'var(--bg-soft)',
          card: 'var(--bg-card)',
        },
        // Accent Colors
        accent: {
          gold: 'var(--accent-gold)',
          'deep-gold': 'var(--accent-deep-gold)',
          rose: 'var(--accent-rose)',
          maroon: 'var(--accent-maroon)',
        },
        // Text Colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        // Border Colors
        border: {
          light: 'var(--border-light)',
          soft: 'var(--border-soft)',
          DEFAULT: 'var(--border-soft)',
        },
        // State Colors
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
      },
      // SPACING SCALE
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
      },
      // BORDER RADIUS SCALE
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      // TRANSITIONS
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      },
      transitionTimingFunction: {
        'in-out': 'ease-in-out',
      },
      // SHADOWS
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        none: 'var(--shadow-none)',
      },
      // FONTS
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      // KEYFRAMES - Only essential, no heavy animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-in-out',
        'slide-up': 'slide-up 300ms ease-in-out',
        'scale-in': 'scale-in 300ms ease-in-out',
      },
      // OPACITY SCALE
      opacity: {
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
      },
    },
  },
   plugins: [animate], 
} satisfies Config;