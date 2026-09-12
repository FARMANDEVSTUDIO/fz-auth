import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0b0d',
        card: '#15151a',
        card2: '#1b1b22',
        edge: '#26262e',
        accent: '#3b82f6',
        accent2: '#2563eb',
      },
    },
  },
  plugins: [],
};

export default config;
