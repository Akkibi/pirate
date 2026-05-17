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
    },
  },
  plugins: [],
};
