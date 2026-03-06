/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        foreground: '#ffffff',
        card: '#151515',
        'card-foreground': '#ffffff',
        border: '#2b2b2b',
        muted: '#b7bcc2',
        brand: {
          50: '#e9fff2',
          100: '#d0ffe6',
          500: '#6af8a2',
          600: '#58d18a',
          700: '#42b372',
        },
        signal: {
          100: '#dbe9f7',
          500: '#3173b3',
          700: '#05365e',
        },
        ink: {
          900: '#0f0f0f',
          800: '#111827',
          700: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['t26-carbon', 'Rajdhani', 'Segoe UI', 'sans-serif'],
        display: ['futura-pt-bold', 'Barlow Condensed', 'Oswald', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
