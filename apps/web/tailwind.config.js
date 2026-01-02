/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'tap': '44px',
        'tap-lg': '48px',
      },
      minWidth: {
        'tap': '44px',
        'tap-lg': '48px',
      },
      fontSize: {
        'mobile-h1': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'mobile-h2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'mobile-h3': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'mobile-body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'mobile-caption': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
}

