/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 六大卡類色（對應 DESIGN.md 7.2 配色系統）
      colors: {
        turbine: '#38bdf8',
        tech: '#34d399',
        fault: '#f87171',
        func: '#ec4899',
        weather: '#fbbf24',
        contract: '#a78bfa',
        legendary: '#fbbf24',
      },
      // 自定義動畫
      keyframes: {
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in-down 0.3s ease-out both',
        'fade-out': 'fade-out 0.3s ease-in both',
      },
    },
  },
  plugins: [],
};
