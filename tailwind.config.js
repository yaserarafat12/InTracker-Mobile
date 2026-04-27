/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'os-bg': '#000000',
        'os-green': '#00E87A',
        'os-amber': '#F5A623',
        'os-card': 'rgba(255, 255, 255, 0.03)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'os-gradient': 'linear-gradient(to bottom, #000000, #0a0a0a)',
      }
    },
  },
  plugins: [],
}
