/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'operational-green': '#10B981',
        'warning-amber': '#F59E0B',
        'critical-red': '#E53935',
        polar: {
          navy: '#08243A',
          glacier: '#EAF7FC',
          cyan: '#00B8E6',
          blue: '#1976D2',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#E53935',
          ice: '#00B8E6',
          accent: '#00B8E6',
          border: '#1D4B75',
          subtle: '#64748B',
          textPrimary: '#0F172A',
          textSecondary: '#334155',
          950: '#08243A',
          900: '#0C2D48',
          850: '#143C60',
          800: '#1D4B75',
          700: '#2A5D8F',
          600: '#475569',
          500: '#64748B',
          surface: '#0F304E',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', '"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        ibmSans: ['"IBM Plex Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
