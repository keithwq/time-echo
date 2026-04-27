/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'paper-base': '#FFFFFF',
        'paper-deep': '#F5F5F5',
        'ink-heavy': '#1A1A1A',
        'ink-medium': '#666666',
        'ink-wash': '#999999',
        'seal-red': '#D32F2F',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Microsoft YaHei"',
          '"PingFang SC"',
          '"Source Han Sans SC"',
          'sans-serif',
        ],
      },
      fontSize: {
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
      },
      lineHeight: {
        snug: '1.3',
        relaxed: '1.6',
      },
      minHeight: {
        '56': '56px',
        '64': '64px',
        '200': '200px',
        '100dvh': '100dvh', // 防止 iOS Safari 底部导航栏遮挡
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite', // 符合 PRD 的缓动曲线
      },
    },
  },
  corePlugins: {
    boxShadow: false, // 禁用阴影类，符合水墨风格
  },
  plugins: [],
};
