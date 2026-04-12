/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6E56',
          dark: '#0A4A3A',
          light: '#149172'
        },
        vigil: {
          content: 'var(--vigil-bg-content)',
          card: 'var(--vigil-bg-card)',
          base: 'var(--vigil-text-base)',
          border: 'var(--vigil-border)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
}
