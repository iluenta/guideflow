
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#1C1F2E',
          50: '#f4f5f7',
          100: '#e3e5e9',
          200: '#c7cbd4',
          300: '#a4aab8',
          400: '#81899c',
          500: '#636d85',
          600: '#4d566b',
          700: '#3d4454',
          800: '#2f3440',
          900: '#1C1F2E', // Base
        },
        indigo: {
          DEFAULT: '#6366F1',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366F1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        emerald: {
          DEFAULT: '#10B981',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10B981',
        },
        amber: {
          DEFAULT: '#F59E0B',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#F59E0B',
        },
        cream: '#F8F7F4',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(28, 31, 46, 0.05)',
        'card': '0 2px 10px rgba(28, 31, 46, 0.03)',
      }
    },
  },
  plugins: [],
}
