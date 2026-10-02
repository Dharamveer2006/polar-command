/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        polar: {
          950: '#FFFFFF',
          900: '#F8FAFC',
          850: '#F1F5F9',
          800: '#E2E8F0',
          700: '#CBD5E1',
          600: '#64748B',
          500: '#475569',
          ice: '#0284C7',
          cyan: '#0284C7',
          accent: '#0284C7',
          subtle: '#64748B',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
