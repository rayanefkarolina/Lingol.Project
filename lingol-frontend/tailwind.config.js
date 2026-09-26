/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        lingol: {
          bg: '#ecf6ff',       /* Azul gelo super suave */
          ink: '#161a35',      /* Navy dos títulos e do wordmark */
          primary: '#2563eb',  /* Azul vibrante */
          purple: '#8b5cf6',   /* Roxo degradê */
          cardBlue: '#dbeafe', /* Azul claro */
          dark: '#1e1b4b'      /* Azul quase preto */
        },
        /* Paleta do tabuleiro gamificado (Lingolgard) */
        game: {
          bg: '#1a1a24',
          panel: '#2a2a3c',
          gold: '#ffd700',
          wood: '#4a3728'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      }
    },
  },
  plugins: [],
}