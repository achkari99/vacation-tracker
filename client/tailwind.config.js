/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b8d8ff',
          300: '#8ac0ff',
          400: '#5aa2ff',
          500: '#2f83ff',
          600: '#1e67db',
          700: '#1a55b4',
          800: '#174890',
          900: '#153d75'
        },
        ink: '#0f172a',
        subtle: '#475569',
        surface: '#f8fafc',
        card: '#ffffff',
        line: '#e2e8f0',
        success: '#16a34a',
        warn: '#f59e0b',
        danger: '#ef4444',
        info: '#0ea5e9'
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.06)',
        hover: '0 10px 28px rgba(15, 23, 42, 0.12)'
      }
    },
  },
  plugins: [],
}
