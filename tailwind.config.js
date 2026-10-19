
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: { 950: '#0f1115', 900: '#15181f', 800: '#1c1f27', 700: '#2a2e3a', 400: '#8a8f9e', 300: '#c2c6d1' },
        racing: { 500: '#d4ff32', 400: '#d4ff32', 600: '#b8e000' },
        crimson: { 400: '#ff6b6b', 500: '#ff6b2b', 600: '#e05a00' }
      }
    }
  },
  plugins: []
}
