/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: '#023047',
        secondary: '#219ebc',
        accent: '#fb8500',
        error: '#EF4444',
        success: '#22C55E',
        warning: '#F97316',
        // Background colors
        'bg-primary': '#f5f5f5',
        'bg-secondary': '#F9FAFB',
        'bg-dark': '#111827',
        // Text colors
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
