/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        venzo: {
          orange: '#fe742a',
          'orange-light': '#ff9d5c',
          'orange-dark': '#c5581e',
        },
      },
    },
  },
  plugins: [],
  // Important for Material-UI compatibility
  corePlugins: {
    preflight: false,
  },
};
