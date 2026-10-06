/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
}
