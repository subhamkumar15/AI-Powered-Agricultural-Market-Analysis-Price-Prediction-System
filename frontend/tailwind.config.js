/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        agri: {
          primary: '#064e3b',     // Deep Forest Green
          secondary: '#047857',   // Emerald Green
          accent: '#10b981',      // Vibrant Mint/Emerald
          light: '#ecfdf5',       // Soft Mint Surface
          gold: '#f59e0b',        // Harvest Amber/Gold
          wheat: '#eab308',       // Wheat Gold
          danger: '#ef4444',      // Alert Red
          dark: '#0f172a',        // Slate 900
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
