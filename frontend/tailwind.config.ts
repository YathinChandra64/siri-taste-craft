/* /frontend/tailwind.config.ts - PREMIUM BRAND COLORS */

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
      // PREMIUM COLOR SYSTEM
      colors: {
        // Background Colors - Light & Dark
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          soft: 'var(--bg-soft)',
          card: 'var(--bg-card)',
        },

        // Primary Brand Purple
        purple: {
          DEFAULT: 'var(--color-purple)',
          light: 'var(--color-purple-light)',
          dark: 'var(--color-purple-dark)',
        },

        // Accent Gold
        gold: {
          DEFAULT: 'var(--accent-gold)',
          light: 'var(--accent-gold-light)',
          dark: 'var(--accent-gold-dark)',
        },

        // Tertiary Accents
        rose: 'var(--accent-rose)',
        maroon: 'var(--accent-maroon)',

        // Text Colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },

        // Border Colors
        border: {
          light: 'var(--border-light)',
          medium: 'var(--border-medium)',
          DEFAULT: 'hsl(var(--border))',
        },

        // State Colors
        success: 'var(--success)',
        'success-light': 'var(--success-light)',
        error: 'var(--error)',
        'error-light': 'var(--error-light)',
        warning: 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        info: 'var(--info)',
        'info-light': 'var(--info-light)',

        // Shadcn/UI Colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      // SPACING
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

      // BORDER RADIUS
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
        premium: 'var(--shadow-premium)',
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

      // ANIMATIONS
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
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 300ms ease-in-out',
        'slide-up': 'slide-up 300ms ease-in-out',
        'scale-in': 'scale-in 300ms ease-in-out',
        'slide-down': 'slide-down 300ms ease-in-out',
      },

      // OPACITY
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

      // GRADIENTS
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, var(--color-purple) 0%, var(--accent-rose) 100%)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;