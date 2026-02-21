/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'progress-fill': {
          from: { width: '0%' },
          to: { width: 'var(--progress-width)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'progress-fill': 'progress-fill 0.8s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'fade-in-up-1': 'fade-in-up 0.4s ease-out 0.05s forwards',
        'fade-in-up-2': 'fade-in-up 0.4s ease-out 0.1s forwards',
        'fade-in-up-3': 'fade-in-up 0.4s ease-out 0.15s forwards',
        'fade-in-up-4': 'fade-in-up 0.4s ease-out 0.2s forwards',
      },
    },
  },
  plugins: [],
}
