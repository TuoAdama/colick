/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
      },
      colors: {
        // Coliclic design system tokens
        primary: '#023047',
        'primary-hover': '#4F46E5',
        secondary: '#219ebc',
        accent: '#FB8500',
        neutral: '#9C9C9C',
        border: '#E8E8EC',
        surface: '#FFFFFF',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        background: {
          primary: '#FAFAFA',
          secondary: '#FFFFFF',
          dark: '#111827',
        },
        text: {
          primary: '#0A0A0A',
          secondary: '#6B6B6B',
          muted: '#9C9C9C',
        },
        // Legacy background aliases kept for existing bg-bg-* utilities.
        'bg-primary': '#FAFAFA',
        'bg-secondary': '#FFFFFF',
        'bg-dark': '#111827',
      },
      fontFamily: {
        display: ['General Sans', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        // Hover elevation for cards
        card: '0 8px 30px rgba(0,0,0,0.08)',
        // Tinted hover glow for primary actions
        'primary-glow': '0 4px 12px rgba(99,102,241,0.35)',
      },
      ringColor: {
        primary: 'rgba(99,102,241,0.12)',
      },
    },
  },
  plugins: [],
};
