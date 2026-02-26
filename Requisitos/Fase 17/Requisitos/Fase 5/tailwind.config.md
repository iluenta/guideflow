
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        // Nueva paleta minimalista
        beige: '#F5F0E8',
        'beige-dark': '#E8E0D4',
        navy: '#1E3A5F',
        'navy-light': '#2D4A6F',
        slate: '#6B7B8C',
        // Mantener algunas anteriores por compatibilidad
        cream: '#FFFDF9',
        charcoal: '#1E3A5F',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(30, 58, 95, 0.08)',
        'card': '0 1px 3px rgba(30, 58, 95, 0.04)',
        'card-hover': '0 4px 16px rgba(30, 58, 95, 0.1)',
      }
    },
  },
  plugins: [],
}
