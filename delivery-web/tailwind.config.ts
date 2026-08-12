import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          500: '#2f7bf6',
          600: '#1f63d6',
          700: '#1a4fad'
        }
      }
    }
  },
  plugins: []
} satisfies Config
