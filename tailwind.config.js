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
        'paper-base': '#F7F4ED',
        'paper-deep': '#EBE5D9',
        'ink-heavy': '#1F1E1D',
        'ink-medium': '#4A4845', // 调整以达到 7:1 对比度
        'ink-wash': '#9C9994',
        'seal-red': '#8B2626',
      },
      fontFamily: {
        serif: [
          'ui-serif',
          'Georgia',
          'Nimbus Roman No9 L',
          'Songti SC',
          'Noto Serif CJK SC',
          'Source Han Serif SC',
          'Source Han Serif CN',
          'STSong',
          'AR PL New Sung',
          'AR PL SungtiL GB',
          'NSimSun',
          'SimSun',
          'serif',
        ],
      },
      fontSize: {
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
      },
      lineHeight: {
        loose: '1.8',
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
