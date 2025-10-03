// filepath: c:\Users\Brandon\Plataforma-Gestion_Viviendas_TECHO-1\frontend\tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        techo: {
          blue: {
            50: '#f2f8ff',
            100: '#e0f0ff',
            200: '#b9e0ff',
            300: '#82c7ff',
            400: '#3fa8ff',
            500: '#0089ff', // primario
            600: '#006dd6',
            700: '#0056ad',
            800: '#004585',
            900: '#023768', // azul institucional oscuro
          },
          cyan: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
          },
          accent: {
            50: '#f3fdf7',
            100: '#e3faed',
            200: '#c5f4da',
            300: '#98e8bd',
            400: '#4fd68f',
            500: '#22c26a', // verde apoyo
            600: '#16a557',
            700: '#158047',
            800: '#16653c',
            900: '#124f31',
          },
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        }
      },
      boxShadow: {
        'soft': '0 2px 4px -2px rgba(0,0,0,0.04), 0 4px 8px -2px rgba(0,0,0,0.06)',
        'elevated': '0 4px 10px -2px rgba(0,0,0,0.08), 0 8px 16px -2px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        'xl': '1rem',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(.215,.61,.355,1)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}