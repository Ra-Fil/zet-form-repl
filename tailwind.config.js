/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'header-black': '#282828',
        'brand-red': '#e10c32',
        'brand-gray': '#8f9193',
        'admin-hover-bg': '#3d4144',
      },
    },
  },
  plugins: [],
}