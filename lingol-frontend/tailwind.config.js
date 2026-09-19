/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        lingol: {
          bg: '#f0f8ff',       /* Azul gelo super suave */
          primary: '#2563eb',  /* Azul vibrante */
          purple: '#8b5cf6',   /* Roxo degradê */
          cardBlue: '#dbeafe', /* Azul claro */
          dark: '#1e1b4b'      /* Azul quase preto */
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      }
    },
  },
  plugins: [],
}