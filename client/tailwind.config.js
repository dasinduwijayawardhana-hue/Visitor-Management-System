/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Semantic aliases pointing to CSS variables ─────────────────
           These let Tailwind utilities like bg-surface / text-primary
           exist in the class space while their actual values are driven
           by the :root / .dark CSS variable blocks in index.css.        */
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        app:      'var(--bg-app)',

        primary: {
          DEFAULT: 'var(--text-primary)',
          inverse: 'var(--primary-text)',
        },
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        disabled:  'var(--text-disabled)',

        border: {
          DEFAULT: 'var(--border-default)',
          subtle:  'var(--border-subtle)',
          strong:  'var(--border-strong)',
        },

        accent: {
          DEFAULT: 'var(--accent)',
          subtle:  'var(--accent-subtle)',
        },

        /* ── Brand palette (kept for direct use in sidebar / brand) ──── */
        ink: {
          DEFAULT: '#10192E',
          light:   '#1C2C4A',
        },
        paper: '#F6F4EF',
        brass: {
          DEFAULT: '#C9A24B',
          dark:    '#A9832F',
          light:   '#E4C877',
        },
        signal: {
          green: '#3FA66A',
          red:   '#D65C4F',
          amber: '#E2A63B',
        },
        slate: {
          850: '#172338',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        badge: '0 1px 2px rgba(16,25,46,0.06), 0 1px 0 rgba(16,25,46,0.04)',
        card:  '0 1px 3px rgba(16,25,46,0.08), 0 1px 2px rgba(16,25,46,0.04)',
        ring:  '0 0 0 3px var(--accent-subtle)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        slideIn: { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        fadeIn:  'fadeIn 0.15s ease-out',
        slideIn: 'slideIn 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
