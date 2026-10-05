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
      boxShadow: {
        'glow-cyan': '0 0 20px -2px rgba(0, 184, 230, 0.45)',
        'glow-cyan-lg': '0 0 35px 2px rgba(0, 184, 230, 0.35)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.45)',
        'glow-amber': '0 0 20px -2px rgba(245, 158, 11, 0.45)',
        'glow-rose': '0 0 20px -2px rgba(229, 57, 53, 0.45)',
        'polar-glass': '0 8px 32px 0 rgba(8, 36, 58, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'polar-glass-hover': '0 12px 36px 0 rgba(0, 184, 230, 0.16), 0 4px 12px 0 rgba(8, 36, 58, 0.08)',
        'polar-elevated': '0 20px 45px -10px rgba(8, 36, 58, 0.2), 0 0 25px -4px rgba(0, 184, 230, 0.25)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(0, 184, 230, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0, 184, 230, 0.2))' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'wave-bars': {
          '0%, 100%': { height: '4px' },
          '50%': { height: '14px' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 5s linear infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'float': 'float 3s ease-in-out infinite',
        'wave-bars': 'wave-bars 1.2s ease-in-out infinite',
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
