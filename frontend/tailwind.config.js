/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1fe',
          100: '#cce4fd',
          200: '#99c9fb',
          300: '#66aef9',
          400: '#3393f7',
          500: '#0078f5',
          600: '#0060c4',
          700: '#004893',
          800: '#003062',
          900: '#001831',
        },
        secondary: {
          50: '#f2f8f9',
          100: '#e6f1f3',
          200: '#cce4e7',
          300: '#99c9cf',
          400: '#66aeb7',
          500: '#33939f',
          600: '#007687',
          700: '#00586c',
          800: '#003b49',
          900: '#001d24',
        },
        success: {
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 15px rgba(0, 0, 0, 0.05)',
        dropdown: '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'card': '0.5rem',
      },
    },
  },
  plugins: [],
} 