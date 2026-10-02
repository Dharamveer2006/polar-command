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
          950: '#070C18',
          900: '#0B132B',
          850: '#111C3D',
          800: '#1C2541',
          700: '#283655',
          600: '#3A506B',
          500: '#4B6B94',
          ice: '#72DDF7',
          cyan: '#00F0FF',
          accent: '#38BDF8',
          subtle: '#94A3B8',
          surface: 'rgba(28, 37, 65, 0.75)',
          border: 'rgba(72, 202, 228, 0.18)',
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
