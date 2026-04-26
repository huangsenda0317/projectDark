/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#f2f0eb',
        ceramic: '#edebe9',
        'house-green': '#1E3932',
        'starbucks-green': '#006241',
        'accent-green': '#00754A',
        'uplift-green': '#2b5148',
        'light-green': '#d4e9e2',
        gold: '#cba258',
        'gold-light': '#dfc49d',
        'gold-lightest': '#faf6ee',
        'text-black': 'rgba(0,0,0,0.87)',
        'text-soft': 'rgba(0,0,0,0.58)',
        'text-white-soft': 'rgba(255,255,255,0.70)',
        danger: '#c82014',
        warning: '#fbbc05',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        gothic: ['Cinzel', 'serif'],
      },
      borderRadius: {
        pill: '50px',
        card: '12px',
      },
      boxShadow: {
        card: '0px 0px 0.5px 0px rgba(0,0,0,0.14), 0px 1px 1px 0px rgba(0,0,0,0.24)',
        nav: '0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
}
