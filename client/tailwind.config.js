/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        neon: {
          green: '#39ff14',
          pink: '#ff1aff',
          blue: '#00eaff',
          yellow: '#ffe600',
        },
      },
    },
  },
  plugins: [],
}


