export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        ink: {
          DEFAULT: '#0b2540',
          muted: '#4a6178',
          soft: '#8296ab',
        },
        canvas: '#f2f8fc',
        line: '#e2edf5',
        review: '#f5b82e',
        declined: '#f43f5e',
        critical: '#8b5cf6',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(12, 74, 110, 0.04), 0 10px 28px -16px rgba(12, 74, 110, 0.18)',
        float: '0 18px 40px -14px rgba(12, 74, 110, 0.32), 0 2px 6px rgba(12, 74, 110, 0.06)',
      },
    },
  },
};
