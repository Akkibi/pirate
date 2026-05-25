const titleFont = ['Shelten', 'Black Crest', 'Georgia', 'serif'];
const bodyFont = ['BackzoneDEMO', 'Georgia', 'serif'];

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        title: titleFont,
        body: bodyFont,
        serif: titleFont,
        sans: bodyFont,
      },
      screens: {
        'compact-landscape': { raw: '(orientation: landscape) and (max-height: 430px)' },
        playable: { raw: '(min-width: 640px) and (min-height: 480px)' },
        tabletop: { raw: '(min-width: 1024px) and (min-height: 620px)' },
      },
    },
  },
  plugins: [],
};
