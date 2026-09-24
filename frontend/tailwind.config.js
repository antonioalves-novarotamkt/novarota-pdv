import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        sidebar: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
          text: '#94a3b8',
          'text-active': '#f1f5f9',
        },
      },
    },
  },
  plugins: [],
}
