/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#dae7ff',
          200: '#bdd3ff',
          300: '#8fb3ff',
          400: '#5a85fd',
          500: '#3661fb',
          600: '#1f43f0',
          700: '#1a35db',
          800: '#1d2fb0',
          900: '#1c2d8b',
          950: '#161e54',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.05)',
        elev: '0 8px 28px rgba(15, 23, 42, 0.10)',
      },
    },
  },
  plugins: [],
};
