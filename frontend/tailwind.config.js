/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D3B66', // Couleur principale du logo Conta
          dark: '#0A2E4D',
          light: '#1A4A7A',
          50: '#E6EDF5',
          100: '#CCDBEB',
          200: '#99B7D7',
          300: '#6693C3',
          400: '#336FAF',
          500: '#1A4A7A',
          600: '#0D3B66',
          700: '#0A2E4D',
          800: '#072134',
          900: '#05141B',
        },
        secondary: {
          DEFAULT: '#1FAB89', // Vert émeraude moderne
          dark: '#188A6F',
          light: '#2BC5A3',
          50: '#E6F7F3',
          100: '#CCEFE7',
          200: '#99DFCF',
          300: '#66CFB7',
          400: '#33BF9F',
          500: '#1FAB89',
          600: '#188A6F',
          700: '#126955',
          800: '#0C483A',
          900: '#062720',
        },
        accent: {
          DEFAULT: '#1FAB89', // Vert émeraude (comme dans le design)
          dark: '#188A6F',
          light: '#2BC5A3',
          50: '#E6F7F3',
          100: '#CCEFE7',
          200: '#99DFCF',
          300: '#66CFB7',
          400: '#33BF9F',
          500: '#1FAB89',
          600: '#188A6F',
          700: '#126955',
          800: '#0C483A',
          900: '#062720',
        },
        danger: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24',
        },
        info: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#60A5FA',
        },
        success: {
          DEFAULT: '#1FAB89',
          dark: '#188A6F',
          light: '#2BC5A3',
        },
        background: {
          DEFAULT: '#FAFBFC',
          white: '#FFFFFF',
          gray: '#F3F4F6',
          light: '#F8F8F8',
          dark: '#111921',
        },
        text: {
          primary: '#0D3B66',
          secondary: '#637688',
          muted: '#9CA3AF',
          light: '#D1D5DB',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#E5E7EB',
          dark: '#374151',
        },
        card: {
          light: '#FFFFFF',
          dark: '#1A242E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'Poppins', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.06)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'primary': '0 4px 20px rgba(13, 59, 102, 0.15)',
        'primary-lg': '0 10px 40px rgba(13, 59, 102, 0.2)',
        'colored': '0 4px 20px rgba(13, 59, 102, 0.15)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0', maxHeight: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1', maxHeight: '500px' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

