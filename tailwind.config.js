/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#f0fafa',
          100: '#d1f5f5',
          400: '#02a8b0',
          500: '#01888f',
          600: '#01696f',
          700: '#015a5f',
          800: '#014a4e',
        },
        sidebar: '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.18s ease-out both',
        'slide-up':   'slideUp 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-down': 'slideDown 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in':   'scaleIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
        'bounce-in':  'bounceIn 0.36s cubic-bezier(0.22, 1, 0.36, 1) both',
        'page-enter':    'pageEnter 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'page-enter-md': 'pageEnterMd 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                                  to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(10px)' },   to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-10px)' },  to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.94)' },        to: { opacity: 1, transform: 'scale(1)' } },
        bounceIn:  {
          '0%':   { opacity: 0, transform: 'scale(0.88)' },
          '60%':  { transform: 'scale(1.04)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        pageEnter: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px -4px rgba(0,0,0,0.10), 0 2px 8px -2px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px -12px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
