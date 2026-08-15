export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B1A4A',
          soft: '#4B4A73',
          muted: '#7A799B',
        },
        brand: {
          50: '#EFEEFF',
          100: '#DEDCFF',
          200: '#BFBBFF',
          300: '#9A93FF',
          400: '#6E63F5',
          500: '#3B2EE8',
          600: '#2B21E5',
          700: '#221BB8',
          800: '#1B1A4A',
        },
        coral: {
          200: '#FFD3D8',
          300: '#FFB4BC',
          400: '#FF9AA6',
          500: '#F97A8A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#F5F6FB',
          line: '#E3E4F0',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 60px -30px rgba(27, 26, 74, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
}
