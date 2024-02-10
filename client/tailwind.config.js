/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{css,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors:{
      'primary': 'white',
      'secondary':'dodgerblue',
      'other':'#667'
    }
  },
  },
  plugins: [
    require('tailwind-scrollbar'),
    ],  
};