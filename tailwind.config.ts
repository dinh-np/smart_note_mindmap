import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        krones: {
          primary: '#0066AB',
          hover: '#004B7D',
          canvas: '#ffffff',
          surface: '#f8f9fa',
          border: '#e2e8f0',
          dark: '#0f172a',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
