/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"], // enables dark mode support
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
};
