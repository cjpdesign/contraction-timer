/** Tailwind build config. Regenerate styles.css after changing classes:
 *   npx tailwindcss@3 -i ./src.css -o ./styles.css --minify
 */
module.exports = {
  content: ['./index.html', './script.js'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      colors: {
        brand: { 50: '#fff1f3', 100: '#ffe4e8', 200: '#fecdd3', 400: '#fb7185', 500: '#f43f6b', 600: '#e11d54', 700: '#be123c' },
        page:    'rgb(var(--c-base) / <alpha-value>)',
        card:    'rgb(var(--c-card) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        line:    'rgb(var(--c-line) / <alpha-value>)',
        track:   'rgb(var(--c-track) / <alpha-value>)',
        ink:     'rgb(var(--c-ink) / <alpha-value>)',
        body:    'rgb(var(--c-body) / <alpha-value>)',
        muted:   'rgb(var(--c-muted) / <alpha-value>)',
        faint:   'rgb(var(--c-faint) / <alpha-value>)',
        danger:  'rgb(var(--c-danger) / <alpha-value>)',
      },
    },
  },
  // Classes built dynamically in JS (LEVELS colors, met-bar) so the purge keeps them.
  safelist: [
    'bg-teal-500', 'border-teal-500', 'ring-teal-400',
    'bg-orange-500', 'border-orange-500', 'ring-orange-500',
    'bg-red-600', 'border-red-600', 'ring-red-500',
    'bg-emerald-500',
  ],
};
