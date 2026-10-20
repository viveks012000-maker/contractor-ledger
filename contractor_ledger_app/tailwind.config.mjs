/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAF8',
        surface: '#FFFFFF',
        'surface-subtle': '#F4F7F5',
        'surface-tint': '#ECF5F0',
        'surface-tint-hover': '#DFECE6',
        'brand-green': '#176B53',
        'brand-green-hover': '#10523F',
        'brand-green-light': '#ECF5F0',
        'brand-green-border': '#A4F2D4',
        'text-primary': '#18211F',
        'text-secondary': '#4F5B57',
        'text-muted': '#6F7974',
        'border-default': '#E5E8E5',
        'border-focus': '#176B53',
        'error-text': '#B44545',
        'error-bg': '#FFDAD6',
        'error-border': '#F5B7B1',
      },
      fontFamily: {
        headline: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(24, 33, 31, 0.05)',
        card: '0 1px 4px rgba(24, 33, 31, 0.06), 0 4px 12px -2px rgba(24, 33, 31, 0.04)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      maxWidth: {
        container: '1240px',
      },
    },
  },
  plugins: [],
};
