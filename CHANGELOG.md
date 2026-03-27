# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Redesign navigazione — Bottom nav pill-style
- Rimossa la vecchia navbar top con hamburger e dropdown
- Nuova bottom nav pill: barra fissa, centrata, border-radius pill (999px)
- 4 icone SVG (solo icona, niente testo): Home, Trips (aereo), Search, Account
- La navbar segue il tema dark/light (colori tramite variabili CSS)
- Hover: animazione translateY(-15px) scale(1.7) su mobile/tablet
- Desktop (>=1024px): navbar verticale a sinistra, hover translateX(15px) scale(1.7)
- Trips panel floating: sopra la nav (mobile) o a destra (desktop)
- Trips panel: popup floating sopra la bottom nav con lista viaggi e pallini colorati
- Icona Account nascosta di default, rivelabile con 5 tap rapidi sul logo (o navigazione diretta a `#admin`), persiste in sessionStorage
- Top bar minimale: logo a sinistra, theme toggle a destra
- Responsive mobile: nav compatta con icone e padding ridotti

### Step 3 — Theming dark/light
- Creato `js/theme.js`: toggle dark/light, persistenza in localStorage, rispetto `prefers-color-scheme` del sistema
- Aggiunto bottone toggle (sole/luna) nella navbar in `index.html`
- Aggiunto in `css/style.css` due set di variabili CSS (`[data-theme="light"]` e `[data-theme="dark"]`) con transizioni smooth
- Integrato init tema e listener toggle in `js/app.js`

### Step 2 — Dati di esempio e stili base
- Creato `js/data.js` con 3 viaggi di esempio (Giappone, Islanda, Marocco) e foto placeholder da picsum.photos
- Creato `js/app.js` come entry point: importa dati, renderizza hero + griglia card
- Creato `css/style.css`: reset CSS, variabili (colori, spacing, tipografia), layout flex, stili card con hover effects, responsive mobile

### Step 1 — Setup npm e scaffolding progetto
- Inizializzato progetto npm con `lite-server` come dev server (`npm start`)
- Creato `.gitignore` (node_modules/, .DS_Store)
- Creato `index.html` con struttura semantica (header > nav, main, footer) e caricamento ES modules
- Create cartelle `css/`, `js/`, `assets/photos/`
