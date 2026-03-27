# Surprise — Travel Photography

Sito web personale per raccogliere e mostrare le fotografie dei viaggi di Alessandro.

## Stack

- HTML + CSS + JS vanilla (ES6+ modules)
- Nessun framework UI, nessun bundler — sito statico puro
- Flexbox layout, dark/light theme, hash routing SPA

## Sviluppo

```bash
npm install
npm start
```

Il dev server (`lite-server`) apre il browser con live reload su `http://localhost:3000`.

## Struttura

```
├── index.html          # Pagina principale (SPA)
├── css/style.css       # Stili, variabili CSS, responsive
├── js/
│   ├── app.js          # Entry point, routing, inizializzazione
│   ├── data.js         # Dati viaggi (array di oggetti)
│   ├── gallery.js      # Card, galleria foto, lightbox
│   ├── menu.js         # Navbar sticky, dropdown, hamburger
│   ├── theme.js        # Toggle dark/light
│   ├── filters.js      # Filtri per tag e ordinamento
│   ├── stats.js        # Contatori animati hero
│   ├── auth.js         # Login admin
│   └── admin.js        # Pannello admin
└── assets/photos/      # Foto organizzate per viaggio
```

## Aggiungere un viaggio

Aggiungere un oggetto all'array `trips` in `js/data.js` e creare la cartella foto corrispondente in `assets/photos/`. In alternativa, usare il pannello admin (`#admin`).
