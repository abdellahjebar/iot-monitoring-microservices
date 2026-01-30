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
          DEFAULT: '#00f2fe',
          dark: '#00c6ff',
        },
        secondary: {
          DEFAULT: '#4facfe',
          dark: '#00f2fe',
        },
        background: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
