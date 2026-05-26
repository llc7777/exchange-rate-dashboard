/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        panel: 'var(--color-panel)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        primary: 'var(--color-primary)',
        danger: 'var(--color-up)',
        info: 'var(--color-down)',
      },
      borderRadius: {
        app: '8px',
      },
      boxShadow: {
        app: '0 12px 28px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
