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
    },
  },
  plugins: [],
};
