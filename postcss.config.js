// tailwindcss configuration for PostCSS
module.exports = {
  plugins: [
    require('@tailwindcss/postcss')(),
    require('autoprefixer')(),
  ],
};
