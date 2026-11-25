/**
 * DhanGyaan design tokens.
 * - brand:  indigo, for actions, focus rings and selected states
 * - gain / loss: RESERVED for directional values (price change, P&L, sentiment).
 *   Light-mode shades are 700-level so small text passes WCAG AA (>= 4.5:1 on white);
 *   dark-mode shades are 400-level for the same contrast on slate-900.
 * - warn: amber, for cautions that aren't losses
 * Spacing uses Tailwind's 4px scale; type uses Inter (UI) + Outfit (display headings).
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        gain: { DEFAULT: '#047857', soft: '#d1fae5', dark: '#34d399', 'dark-soft': '#064e3b' },
        loss: { DEFAULT: '#be123c', soft: '#ffe4e6', dark: '#fb7185', 'dark-soft': '#4c0519' },
        warn: { DEFAULT: '#b45309', soft: '#fef3c7', dark: '#fbbf24', 'dark-soft': '#451a03' },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-in': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.22s ease-out',
        'slide-in-right': 'slide-in-right 0.22s ease-out',
      },
    },
  },
  plugins: [],
};
