# Piano: Sito Web Travel Photography

## Contesto
Alessandro vuole un sito personale per raccogliere le fotografie dei suoi viaggi. Il sito deve essere moderno, accattivante, con colori vividi. Ogni viaggio ha un colore identificativo. Stack: HTML + CSS + JS vanilla ES6+. Nessun framework, nessun build tool — sito statico puro, pronto per essere hostato ovunque.

**Preferenze utente:**
- Doppio tema dark/light con toggle switch, preferenza salvata in localStorage
- Navbar sticky che segue lo scroll della pagina (si riduce/cambia stile on scroll)

---

## Struttura file/cartelle

```
Surprise/
├── index.html              # Pagina principale (SPA single-page)
├── css/
│   └── style.css           # Stili (variabili CSS per dark/light, layout, animazioni)
├── js/
│   ├── app.js              # Entry point — routing, tema, inizializzazione
│   ├── data.js             # Dati dei viaggi (export array di oggetti)
│   ├── gallery.js          # Rendering card + galleria foto + lightbox
│   ├── menu.js             # Navbar sticky + dropdown viaggi + hamburger mobile
│   └── theme.js            # Toggle dark/light, persistenza in localStorage
├── assets/
│   └── photos/             # Cartella foto, una sotto-cartella per viaggio
│       ├── giappone/
│       ├── islanda/
│       └── ...
└── README.md
```

---

## Modello dati (`js/data.js`)

```js
export const trips = [
  {
    id: "giappone",
    name: "Giappone",
    date: "2024-04",
    color: "#E63946",
    cover: "assets/photos/giappone/cover.jpg",
    description: "Tokyo, Kyoto e il Monte Fuji",
    photos: [
      { src: "assets/photos/giappone/01.jpg", caption: "Tempio di Fushimi Inari" },
      { src: "assets/photos/giappone/02.jpg", caption: "Shibuya crossing" },
    ]
  },
  // ...altri viaggi
];
```

Per aggiungere un viaggio: aggiungere un oggetto all'array + mettere le foto nella cartella.

---

## Architettura CSS

### Theming dark/light
- Due set di variabili CSS sotto `[data-theme="dark"]` e `[data-theme="light"]` sul `<html>`
- Variabili: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--surface`, `--shadow`
- `--trip-color` settata dinamicamente via JS per il colore accento del viaggio selezionato
- Transizione smooth (`transition: background-color 0.3s, color 0.3s`) al cambio tema

### Layout
- Flexbox con `flex-wrap` per la griglia di trip card e per la galleria foto
- Flexbox per navbar e componenti interni

### Responsive
- Mobile-first, breakpoint: 768px (tablet), 1200px (desktop)
- Navbar: hamburger menu su mobile, espansa su desktop

### Animazioni
- Card: scale + box-shadow colorato on hover
- Foto galleria: fade-in con `IntersectionObserver`
- Lightbox: fade + scale in/out
- Navbar: riduzione altezza + aggiunta ombra on scroll

---

## Componenti principali

### 1. Navbar Sticky
- Posizione `fixed` in alto, segue lo scroll
- Contiene: logo/titolo, dropdown "Viaggi" (con dot colorato per ogni viaggio), toggle tema
- On scroll > 50px: si compatta (altezza ridotta, aggiunge `box-shadow`)
- Su mobile: hamburger button -> menu a tendina fullwidth
- Il dropdown viaggi mostra un pallino colorato accanto a ogni nome

### 2. Landing Page (Hero + Trip Cards)
- Sezione hero con titolo grande e sottotitolo
- Griglia di card, una per viaggio
- Ogni card: immagine cover, overlay gradient con nome + data, bordo bottom nel colore del viaggio
- Hover: leggero zoom immagine + glow con il colore del viaggio

### 3. Vista Galleria Viaggio
- Transizione dalla landing via hash routing (`#trip/giappone`)
- Header con nome, descrizione, data — accento nel colore del viaggio
- Bottone "Torna ai viaggi"
- Griglia foto responsive
- Click su foto -> lightbox

### 4. Lightbox
- Overlay scuro fullscreen
- Foto centrata con dimensione massima viewport
- Frecce prev/next (click + tastiera)
- Caption sotto la foto
- Chiudi con X, click fuori, Escape
- Counter foto (es. "3 / 12")

### 5. Theme Toggle
- Icona sole/luna nella navbar
- Click: switcha `data-theme` su `<html>`, salva in localStorage
- Al caricamento: legge localStorage oppure rispetta `prefers-color-scheme`

---

## Moduli JavaScript

| Modulo | Responsabilita |
|--------|---------------|
| `data.js` | Esporta l'array `trips` |
| `app.js` | Entry point: inizializza tema, menu, routing. Ascolta `hashchange` per navigare tra landing e galleria |
| `theme.js` | Toggle dark/light, persistenza localStorage, rispetto `prefers-color-scheme` iniziale |
| `menu.js` | Genera navbar con dropdown viaggi, gestisce hamburger mobile, comportamento sticky on scroll |
| `gallery.js` | Renderizza trip cards (landing) e griglia foto (galleria), gestisce lightbox completo |

---

## Step di implementazione (sequenziali)

Ogni step dipende dal completamento del precedente. Alla fine di ogni step il sito deve essere apribile e funzionante con le feature implementate fino a quel punto.

---

### Step 1 — Scaffolding progetto e dati
**Obiettivo:** Creare la struttura di cartelle/file e i dati di esempio.
**File coinvolti:** `index.html`, `css/style.css`, `js/data.js`, `js/app.js`
**Cosa si ottiene:** Un `index.html` vuoto ma ben strutturato che carica i moduli JS. I dati dei viaggi sono pronti. Lo stile ha il reset CSS e le variabili base.
- Creare le cartelle `css/`, `js/`, `assets/photos/`
- `index.html`: struttura semantica (header > nav, main, footer), caricamento moduli ES6
- `css/style.css`: reset, variabili CSS (colori, spacing, tipografia), layout base
- `js/data.js`: 2-3 viaggi di esempio con foto placeholder
- `js/app.js`: entry point minimale che importa i dati e logga in console

---

### Step 2 — Theming dark/light
**Obiettivo:** Implementare il sistema di temi con toggle.
**File coinvolti:** `js/theme.js`, `css/style.css`, `index.html`
**Cosa si ottiene:** La pagina ha due temi (dark/light), un toggle funzionante nella navbar, e la preferenza persiste al reload.
- `css/style.css`: due set di variabili CSS sotto `[data-theme="dark"]` e `[data-theme="light"]`
- `js/theme.js`: logica toggle, persistenza localStorage, rispetto `prefers-color-scheme`
- `index.html`: aggiungere il bottone toggle nella nav
- `js/app.js`: inizializzare il tema al caricamento

---

### Step 3 — Navbar sticky + menu viaggi
**Obiettivo:** Barra di navigazione funzionante con dropdown viaggi.
**File coinvolti:** `js/menu.js`, `css/style.css`, `index.html`
**Cosa si ottiene:** Navbar fissa in alto che si compatta on scroll, con dropdown che elenca i viaggi (pallino colorato per ognuno). Hamburger menu su mobile.
- `js/menu.js`: generazione dinamica del dropdown dai dati, hamburger toggle, scroll listener per compattamento
- `css/style.css`: stili navbar fixed, transizione compattamento, dropdown, hamburger, responsive

---

### Step 4 — Landing page con trip cards
**Obiettivo:** La home page mostra le card dei viaggi.
**File coinvolti:** `js/gallery.js`, `css/style.css`
**Cosa si ottiene:** Griglia flex di card con cover, nome, data. Ogni card ha il bordo/accento nel colore del viaggio. Hover animato.
- `js/gallery.js`: funzione per renderizzare le trip card nel `<main>`
- `css/style.css`: layout flex-wrap per le card, hover effects (scale, glow colorato), overlay gradient
- `js/app.js`: chiamare il rendering delle card all'avvio

---

### Step 5 — Routing e vista galleria viaggio
**Obiettivo:** Click su una card o voce menu porta alla galleria foto del viaggio.
**File coinvolti:** `js/app.js`, `js/gallery.js`, `css/style.css`
**Cosa si ottiene:** Navigazione hash-based (`#trip/giappone`). La galleria mostra header con colore accento e griglia foto. Bottone "Torna ai viaggi". Deep linking funzionante.
- `js/app.js`: listener `hashchange`, logica routing (landing vs galleria)
- `js/gallery.js`: funzione rendering galleria (header colorato + griglia foto flex)
- `css/style.css`: stili galleria, header con accento, griglia foto responsive
- Collegare click card e click menu al cambio hash

---

### Step 6 — Lightbox
**Obiettivo:** Visualizzazione foto fullscreen con navigazione.
**File coinvolti:** `js/gallery.js`, `css/style.css`
**Cosa si ottiene:** Click su foto apre overlay fullscreen. Navigazione prev/next con click e tastiera. Counter, caption, chiusura con X/Escape/click esterno.
- `js/gallery.js`: logica lightbox (apertura, chiusura, navigazione, keyboard events)
- `css/style.css`: overlay, centratura foto, animazioni fade/scale, frecce, counter

---

### Step 7 — Polish e animazioni
**Obiettivo:** Rifinitura finale dell'esperienza utente.
**File coinvolti:** tutti
**Cosa si ottiene:** Sito completo, fluido, responsive, con animazioni di entrata e lazy loading.
- Lazy loading immagini (`loading="lazy"`)
- Animazioni di entrata card (fade-in/slide-up con IntersectionObserver)
- Responsive tuning finale (375px, 768px, 1440px)
- Favicon e meta tag Open Graph
- Pulizia codice e test finale

---

## Verifica

1. Aprire `index.html` con Live Server di VS Code
2. **Tema**: verificare toggle dark/light, che la preferenza persista al reload
3. **Navbar**: verificare compattamento on scroll, dropdown viaggi con pallini colorati, hamburger su mobile
4. **Landing**: card viaggi con colori corretti, hover effects
5. **Navigazione**: click card -> galleria, dropdown menu -> galleria, bottone indietro
6. **Galleria**: foto con colore accento del viaggio, griglia responsive
7. **Lightbox**: apertura, navigazione prev/next (click + tastiera), chiusura (X, click fuori, Escape)
8. **Deep linking**: ricaricare su `#trip/giappone` -> si apre direttamente la galleria
9. **Responsive**: testare su 375px (mobile), 768px (tablet), 1440px (desktop)
