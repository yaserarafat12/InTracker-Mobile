/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'os-bg': '#16181c',
        'os-green': '#00FF85',
        'os-deepcharc': '#16181c',
        'os-card-bg': '#1c1e22',
        'os-amber': '#F5A623',
        'os-card': 'rgba(255, 255, 255, 0.03)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        nova: ['"Nova Square"', 'sans-serif'],
      },
      backgroundImage: {
        'os-gradient': 'linear-gradient(to bottom, #000000, #0a0a0a)',
      }
    },
  },
  plugins: [],
}
