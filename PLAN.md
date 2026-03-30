# Piano: Sito Web Travel Photography

## Contesto
Alessandro vuole un sito personale per raccogliere le fotografie e i video dei suoi viaggi. Il sito deve essere moderno, accattivante, con colori vividi. Ogni viaggio ha un colore identificativo. Stack: HTML + CSS + JS vanilla ES6+. Nessun framework UI, nessun bundler — sito statico puro, pronto per essere hostato ovunque.

**Preferenze utente:**
- Doppio tema dark/light con toggle switch, preferenza salvata in localStorage
- Navbar sticky che segue lo scroll della pagina (si riduce/cambia stile on scroll)
- Layout basato su Flexbox (no CSS Grid)

**Tooling:**
- npm per gestire gli script di sviluppo (`npm start` per il dev server)
- `lite-server` come dev server locale (supporta ES modules, live reload, zero config)

**Librerie esterne (via CDN):**
- **Leaflet.js** — mappa interattiva con tile OpenStreetMap (gratis, nessuna API key)

---

## Struttura file/cartelle

```
Surprise/
├── package.json            # Script npm e dipendenze dev
├── .gitignore              # node_modules/, .DS_Store
├── index.html              # Pagina principale (SPA single-page)
├── css/
│   └── style.css           # Stili (variabili CSS per dark/light, layout, animazioni)
├── js/
│   ├── app.js              # Entry point — routing, tema, inizializzazione
│   ├── data.js             # Dati dei viaggi (export array di oggetti)
│   ├── gallery.js          # Rendering card + galleria foto + lightbox
│   ├── menu.js             # Navbar sticky + dropdown viaggi + hamburger mobile
│   ├── theme.js            # Toggle dark/light, persistenza in localStorage
│   ├── filters.js          # Filtraggio per tag e ordinamento per data
│   ├── stats.js            # Contatori animati nella hero
│   ├── search.js           # Ricerca full-text su viaggi, foto, sezioni, POI
│   ├── map.js              # Mappa Leaflet con punti di interesse
│   ├── auth.js             # Login admin: validazione credenziali, sessione
│   └── admin.js            # Pannello admin: dashboard, trip editor, tag manager, POI editor
├── assets/
│   └── photos/             # Cartella foto, una sotto-cartella per viaggio
│       ├── giappone/
│       ├── islanda/
│       └── ...
├── PLAN.md
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
    heroImage: "assets/photos/giappone/hero.jpg",   // immagine hero full-screen per la pagina viaggio
    description: "Tokyo, Kyoto e il Monte Fuji",
    tags: ["asia", "cultura", "citta"],
    published: true,              // false = visibile solo nell'admin (draft)
    sections: [                   // sezioni narrative testo+media nella pagina viaggio
      {
        type: "text-image",       // layout: testo a sinistra, media a destra
        title: "Tokyo by night",
        text: "La capitale giapponese si trasforma...",
        media: { type: "image", src: "assets/photos/giappone/05.jpg", caption: "Shinjuku Golden Gai" }
      },
      {
        type: "image-text",       // layout invertito: media a sinistra, testo a destra
        title: "I templi di Kyoto",
        text: "L'antica capitale imperiale conserva...",
        media: { type: "video", src: "assets/videos/giappone/kyoto.mp4", poster: "assets/photos/giappone/06.jpg" }
      }
    ],
    pois: [                       // punti di interesse per la mappa interattiva
      { lat: 34.9671, lng: 135.7727, name: "Fushimi Inari", icon: "temple", note: "1000 torii rossi" },
      { lat: 35.6762, lng: 139.6503, name: "Shibuya Crossing", icon: "city", note: "L'incrocio piu famoso del mondo" }
    ],
    photos: [
      { src: "assets/photos/giappone/01.jpg", caption: "Tempio di Fushimi Inari" },
      { src: "assets/photos/giappone/02.jpg", caption: "Shibuya crossing" },
    ]
  },
  // ...altri viaggi
];
```

> **Nota:** Il sito pubblico mostra solo i viaggi con `published: true`. L'admin li mostra tutti.

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
- **Transizione tra viste:** animazione fade-out/fade-in al passaggio tra landing e galleria (e viceversa)
- **Sezioni split:** slide-in da sinistra/destra con IntersectionObserver
- **Contatori:** count-up animato triggerato allo scroll (IntersectionObserver)

---

## Componenti principali

### 1. Navbar Sticky
- Posizione `fixed` in alto, segue lo scroll
- Contiene: logo/titolo, dropdown "Viaggi" (con dot colorato per ogni viaggio), toggle tema
- On scroll > 50px: si compatta (altezza ridotta, aggiunge `box-shadow`)
- Su mobile: hamburger button -> menu a tendina fullwidth
- Il dropdown viaggi mostra un pallino colorato accanto a ogni nome

### 2. Home Page (Editorial Storytelling)

La home page ha una struttura editoriale con personalita, non una semplice griglia di card:

#### 2a. Hero immersiva con slideshow
- Immagine/slideshow a tutto schermo con le migliori foto dai viaggi (auto-rotate ogni 5s, fade transition)
- Overlay sfumato scuro per leggibilita del testo
- Titolo grande "Surprise" + sottotitolo "Travel Photography" sovrapposti
- CTA "Esplora i viaggi" che scrolla giu con smooth scroll
- Contatori animati sotto il titolo: "X viaggi, Y paesi, Z foto" con count-up triggerato allo scroll

#### 2b. Ultimo viaggio in evidenza
- Il viaggio piu recente (per data) presentato in formato large/editoriale
- Layout: immagine grande a sinistra (o sopra su mobile) + titolo, descrizione, data, tags a destra
- Stile "articolo di copertina" — si distingue nettamente dalla griglia
- Link diretto alla pagina del viaggio

#### 2c. Moments strip
- Striscia orizzontale scrollabile con una selezione di foto dai vari viaggi
- Ogni foto ha un overlay on hover che mostra il nome del viaggio di provenienza
- Scroll orizzontale con drag manuale (CSS `overflow-x: auto` + `scroll-snap-type`)
- Estetica: bordi arrotondati, gap stretto, altezza fissa con object-fit cover

#### 2d. Griglia viaggi
- Le trip card come nella versione attuale, con filtri per tag e ordinamento per data
- Precedute dalle sezioni sopra

#### 2e. Mini About teaser
- Sezione compatta: foto profilo circolare + frase breve + link "Scopri di piu" verso `#about`
- Subito prima del footer

### 3. Pagina Viaggio (Narrativa)

Ogni viaggio ha una pagina strutturata come racconto visivo:

#### 3a. Hero viaggio
- `heroImage` a tutto schermo con effetto parallax leggero (CSS `background-attachment: fixed` o transform su scroll)
- Nome viaggio, descrizione, data sovrapposti con overlay sfumato
- Bottone "Torna ai viaggi" in alto

#### 3b. Sezioni split testo+media
- Array `sections[]` dal data model, renderizzate in ordine
- Tipo `text-image`: testo a sinistra, media a destra (su mobile: stack verticale)
- Tipo `image-text`: media a sinistra, testo a destra
- Media puo essere `image` o `video` (tag `<video>` con poster, controls, lazy loading)
- Animazione di entrata allo scroll: il testo scivola dal lato opposto, il media fade-in
- Ogni sezione ha titolo, testo lungo, e media con caption opzionale

#### 3c. Galleria foto
- Griglia foto flex-wrap come nella versione attuale
- Click su foto -> lightbox

#### 3d. Mappa interattiva
- Mappa Leaflet con tile OpenStreetMap
- Marker per ogni POI dal campo `pois[]` del viaggio
- Popup su click del marker: nome, nota, eventuale mini-foto
- Auto-zoom con `fitBounds()` per contenere tutti i marker
- Icone marker personalizzabili per categoria (`icon` field: temple, city, nature, food, ecc.)
- La mappa si mostra solo se ci sono POI nel viaggio
- Stile tile coerente col tema dark/light (tile scure per dark mode)

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

### 6. Filtri e ordinamento
- Barra filtri sopra le card nella landing: bottoni tag (es. "asia", "natura", "citta") + ordinamento per data (recenti/meno recenti)
- Click su un tag: filtra le card mostrando solo i viaggi con quel tag
- Filtro attivo evidenziato visivamente
- Animazione smooth quando le card appaiono/scompaiono

### 7. Ricerca (`#search`)
- Raggiungibile dal bottone "Search" nella bottom nav (attualmente placeholder)
- **Barra di ricerca** con input testuale, ricerca in tempo reale (keyup con debounce ~300ms)
- Cerca tra: nomi dei viaggi, descrizioni, tag, caption delle foto, testi delle sezioni split, nomi dei POI
- **Risultati raggruppati per tipo**: viaggi (card compatte), foto (thumbnail con caption e nome viaggio), sezioni (titolo + estratto testo)
- Click su un risultato: naviga alla pagina del viaggio corrispondente (o apre il lightbox per le foto)
- Stato vuoto: mostra suggerimenti ("Prova a cercare: Giappone, aurora, tempio...")
- Nessun risultato: messaggio friendly con suggerimento di termini alternativi
- Gestita come vista separata via hash routing (`#search`) oppure come overlay/pannello che si apre sopra il contenuto
- Coerente col tema dark/light
- `js/search.js`: logica di ricerca full-text sui dati, rendering risultati, debounce input

### 8. Sezione About
- Raggiungibile tramite link nella navbar e/o nel footer
- Breve bio, foto profilo, contatti/social
- Gestita come vista separata via hash routing (`#about`)

### 8. Footer (3 colonne)
- **Colonna 1:** Logo "Surprise" + tagline breve ("Storie di viaggio attraverso la fotografia")
- **Colonna 2:** Link rapidi (Home, Ultimi viaggi, About)
- **Colonna 3:** Social icons (Instagram, ecc.) + email contatto
- **Banda decorativa superiore:** foto panoramica sfumata o pattern/gradient che crea continuita col contenuto
- Copyright in fondo, centrato
- Layout: 3 colonne su desktop, stack verticale su mobile
- Coerente col tema dark/light

### 9. Routing robusto
- Hash routing con gestione di rotte inesistenti (pagina 404 con messaggio e link alla home)
- `document.title` aggiornato dinamicamente per ogni vista (es. "Giappone — Surprise", "About — Surprise")
- Transizione animata tra le viste (fade-out/fade-in)

### 10. Gestione errori immagini (sito pubblico)
- Fallback/placeholder visivo per immagini che non caricano (`onerror` handler)
- Nessuna immagine rotta visibile all'utente — sempre un placeholder coerente col design

### 11. Pannello Admin (`#admin`)
- Rotta `#admin` — se non autenticato, mostra il form di login
- **Login**: form con username e password, credenziali verificate tramite hash SHA-256 confrontato con hash salvato come costante (credenziali iniziali: username `Admin`, password `Admin`)
- **Nota:** questa e' una protezione cosmetica/deterrente, non sicurezza reale — le credenziali e l'hash sono nel JS client-side e bypassabili da chiunque apra la console
- **Sessione**: al login riuscito, salva un token di sessione in `sessionStorage` (scade alla chiusura del tab)
- **Dashboard**: panoramica rapida — n. viaggi (pubblicati/draft), n. foto totali, n. tag, foto per viaggio
- **Trip editor**: form visuale per creare/modificare un viaggio (nome, data, colore con color picker, descrizione, heroImage, tags, published). Lista viaggi con badge "Draft"/"Pubblicato"
- **Section editor**: per ogni viaggio, gestione delle sezioni split (aggiungi/rimuovi/riordina sezioni, tipo text-image/image-text, titolo, testo, media con tipo image/video)
- **Photo organizer**: per ogni viaggio, lista foto con drag & drop per riordinare (solo desktop — su mobile usare bottoni su/giu come fallback), modifica caption inline, scelta cover, segnalazione immagini rotte (broken image checker)
- **POI editor**: per ogni viaggio, lista dei punti di interesse con campi lat/lng, nome, icona (select con categorie), nota. Aggiunta/rimozione POI. Mini-preview mappa che mostra dove cade il punto
- **Tag manager**: lista tag con conteggio viaggi per tag, rinomina, elimina, merge tag duplicati
- **Persistenza intermedia**: le modifiche fatte nell'admin vengono salvate in `localStorage` oltre che in memoria, cosi non si perdono tra una sessione e l'altra senza dover esportare ogni volta
- **Esporta/Importa**: bottone "Esporta data.js" scarica il file aggiornato. Bottone "Importa JSON" carica dati da file
- **Logout**: torna alla home pubblica, cancella sessione

### 12. Accessibilita (a11y)
- `aria-label` su tutti i controlli interattivi (toggle tema, hamburger, lightbox, filtri)
- Focus trap nel lightbox (Tab cicla solo tra i controlli del lightbox)
- `skip-to-content` link nascosto, visibile on focus
- Ruoli ARIA: `role="dialog"` per lightbox, `aria-expanded` per dropdown
- Focus visibile su tutti gli elementi interattivi (outline personalizzato)

---

## Moduli JavaScript

| Modulo | Responsabilita |
|--------|---------------|
| `data.js` | Esporta l'array `trips` con dati completi (sections, pois, photos, ecc.) |
| `app.js` | Entry point: inizializza tema, menu, routing. Ascolta `hashchange` per navigare tra le viste. Gestisce 404 e aggiorna `document.title` |
| `theme.js` | Toggle dark/light, persistenza localStorage, rispetto `prefers-color-scheme` iniziale |
| `menu.js` | Genera navbar con dropdown viaggi, gestisce hamburger mobile, comportamento sticky on scroll |
| `gallery.js` | Renderizza trip cards (landing) e pagina viaggio completa (hero, sezioni split, griglia foto), gestisce lightbox, gestisce fallback immagini rotte |
| `filters.js` | Filtraggio per tag e ordinamento per data sulla landing page |
| `stats.js` | Calcola e renderizza i contatori animati nella hero (viaggi, paesi, foto) con count-up on scroll |
| `search.js` | Ricerca full-text su viaggi, foto, sezioni e POI. Rendering risultati raggruppati, debounce input |
| `map.js` | Inizializza mappa Leaflet, renderizza marker POI con popup, gestisce auto-zoom e tema tile |
| `auth.js` | Login admin: validazione credenziali via hash SHA-256, gestione sessione in sessionStorage |
| `admin.js` | Pannello admin: dashboard, trip editor, section editor, photo organizer, POI editor, tag manager, esporta/importa |

---

## Step di implementazione (sequenziali)

Ogni step dipende dal completamento del precedente. Alla fine di ogni step il sito deve essere apribile e funzionante con le feature implementate fino a quel punto.

---

### Step 1 — [DONE] Setup npm e scaffolding progetto
**Obiettivo:** Inizializzare il progetto npm, creare la struttura di cartelle e il dev server.
**File coinvolti:** `package.json`, `.gitignore`, `index.html`, cartelle `css/`, `js/`, `assets/photos/`
- `npm init` con le info base del progetto
- Installare `lite-server` come devDependency
- Aggiungere script `"start": "lite-server"` in package.json
- Creare `.gitignore` (`node_modules/`, `.DS_Store`)
- Creare le cartelle `css/`, `js/`, `assets/photos/`
- `index.html`: struttura semantica minimale (header > nav, main, footer)

**Verifica:** `npm start` apre il browser con la pagina vuota, live reload funziona.

---

### Step 2 — [DONE] Dati di esempio e stili base
**Obiettivo:** Preparare i dati dei viaggi e il CSS fondamentale.
**File coinvolti:** `js/data.js`, `js/app.js`, `css/style.css`
- `js/data.js`: 2-3 viaggi di esempio con foto placeholder da `picsum.photos` (nessuna immagine locale necessaria per ora)
- `js/app.js`: entry point che importa i dati e renderizza un test visivo nel `<main>`
- `css/style.css`: reset CSS, variabili base (colori, spacing, tipografia), layout base body/main

**Verifica:** La pagina mostra i nomi dei viaggi come testo semplice. I dati sono accessibili in console.

---

### Step 3 — [DONE] Theming dark/light
**Obiettivo:** Implementare il sistema di temi con toggle.
**File coinvolti:** `js/theme.js`, `css/style.css`, `index.html`
- `css/style.css`: due set di variabili CSS sotto `[data-theme="dark"]` e `[data-theme="light"]`
- `js/theme.js`: logica toggle, persistenza localStorage, rispetto `prefers-color-scheme`
- `index.html`: aggiungere il bottone toggle nella nav
- `js/app.js`: inizializzare il tema al caricamento

**Verifica:** Il toggle switcha i colori. Ricaricare la pagina mantiene la scelta. Se non c'e' preferenza salvata, rispetta il tema del sistema operativo.

---

### Step 4 — [DONE] Navbar sticky + menu viaggi
**Obiettivo:** Barra di navigazione funzionante con dropdown viaggi.
**File coinvolti:** `js/menu.js`, `css/style.css`
- `js/menu.js`: generazione dinamica del dropdown dai dati, hamburger toggle, scroll listener per compattamento
- `css/style.css`: stili navbar fixed, transizione compattamento, dropdown, hamburger, responsive

**Verifica:** La navbar resta fissa in alto. Scrollando si compatta. Il dropdown mostra i viaggi con pallini colorati. Su viewport < 768px appare l'hamburger.

---

### Step 5 — [DONE] Home page editorial con hero immersiva
**Obiettivo:** La home page diventa un'esperienza editoriale con sezioni distinte.
**File coinvolti:** `js/app.js`, `js/gallery.js`, `js/stats.js` (nuovo), `css/style.css`, `js/data.js`

> **Da implementare:**
> 1. Aggiornare `data.js` con i nuovi campi: `heroImage`, `sections[]`, `pois[]`
> 2. Hero immersiva: slideshow a tutto schermo con foto dai viaggi, overlay sfumato, titolo + sottotitolo sovrapposti, CTA "Esplora i viaggi"
> 3. Contatori animati nella hero: "X viaggi, Y paesi, Z foto" con count-up triggerato da IntersectionObserver
> 4. Sezione "Ultimo viaggio": il viaggio piu recente in formato large/editoriale (immagine grande + info)
> 5. Moments strip: striscia orizzontale scrollabile con foto selezionate dai viaggi
> 6. Griglia trip card con filtri (gia implementata, da integrare sotto le nuove sezioni)
> 7. Mini About teaser: foto profilo + frase + link a `#about`
> 8. Fallback `onerror` sulle immagini per gestire foto che non caricano

- `js/stats.js`: calcolo dinamico + animazione count-up con IntersectionObserver
- `js/gallery.js`: nuove funzioni per sezione "ultimo viaggio" e "moments strip"
- `css/style.css`: stili per hero slideshow, sezione editoriale, moments strip, about teaser

**Verifica:** La hero cattura l'attenzione con slideshow a tutto schermo. Lo slideshow ruota automaticamente. I contatori si animano quando scrollano in vista. L'ultimo viaggio e' in evidenza con layout editoriale. La moments strip e' scrollabile orizzontalmente. Le card appaiono sotto con filtri funzionanti. Il teaser about e' visibile prima del footer.

---

### Step 6 — [DONE] Routing robusto e pagina viaggio narrativa
**Obiettivo:** Routing con 404, titoli dinamici, transizioni, e pagina viaggio ristrutturata.
**File coinvolti:** `js/app.js`, `js/gallery.js`, `css/style.css`

> **Da implementare:**
> 1. Gestione 404: pagina "Non trovato" per rotte/trip inesistenti, con link alla home
> 2. `document.title` aggiornato dinamicamente per ogni vista
> 3. Animazione di transizione fade-out/fade-in tra le viste
> 4. Pagina viaggio ristrutturata: hero full-screen con `heroImage` + parallax → sezioni split testo+media → galleria foto → (placeholder per mappa, step successivo)
> 5. Sezioni split: rendering da `sections[]`, layout alternato, supporto video, animazione entrata allo scroll
> 6. Bottone "Torna ai viaggi" in overlay sulla hero

**Verifica:** Click card -> transizione animata -> pagina viaggio con hero full-screen. Le sezioni split si animano allo scroll. Il video funziona con controlli nativi. `#trip/nonexistent` mostra pagina 404. Il titolo del browser cambia per ogni vista. Deep linking funziona.

---

### Step 7 — [DONE] Lightbox
**Obiettivo:** Visualizzazione foto fullscreen con navigazione.
**File coinvolti:** `js/gallery.js`, `css/style.css`
- `js/gallery.js`: logica lightbox (apertura, chiusura, navigazione, keyboard events)
- `css/style.css`: overlay, centratura foto, animazioni fade/scale, frecce, counter

**Verifica:** Click foto -> overlay fullscreen. Frecce e tastiera per prev/next. Counter "3 / 12" visibile. Chiusura con X, Escape, click fuori dall'immagine.

---

### Step 8 — [DONE] Filtri e ordinamento viaggi
**Obiettivo:** Permettere all'utente di filtrare i viaggi per tag e ordinarli per data.
**File coinvolti:** `js/filters.js`, `js/gallery.js`, `css/style.css`
- `js/filters.js`: logica filtro per tag, ordinamento per data (recenti/meno recenti), rendering barra filtri
- `js/gallery.js`: integrare i filtri nel rendering delle card (mostra/nascondi con animazione)
- `css/style.css`: stili barra filtri, bottoni tag attivi/inattivi, transizione card filtrate

**Verifica:** I bottoni tag filtrano le card. L'ordinamento inverte l'ordine. Filtro attivo ha stile evidenziato. Le card appaiono/scompaiono con animazione smooth.

---

### Step 9 — [DONE] Mappa interattiva con Leaflet
**Obiettivo:** Integrare una mappa interattiva nella pagina viaggio con i punti di interesse.
**File coinvolti:** `js/map.js` (nuovo), `js/gallery.js`, `css/style.css`, `index.html`
- `index.html`: aggiungere CSS e JS di Leaflet via CDN
- `js/map.js`: inizializzazione mappa, rendering marker da `pois[]`, popup con info, `fitBounds()` per auto-zoom
- Tile layer diverso per tema dark/light (tile scure per dark mode)
- Icone marker personalizzate per categoria (o marker colorati con il colore del viaggio)
- La mappa si renderizza solo se il viaggio ha almeno un POI
- `css/style.css`: stili container mappa, responsive, bordi arrotondati

**Verifica:** La pagina viaggio mostra la mappa sotto la galleria (se ci sono POI). I marker sono posizionati correttamente. Click su marker -> popup con nome e nota. La mappa si auto-zooma per contenere tutti i marker. Cambiando tema, i tile della mappa cambiano.

---

### Step 10 — [DONE] Ricerca
**Obiettivo:** Implementare la funzionalita di ricerca full-text accessibile dalla bottom nav.
**File coinvolti:** `js/search.js` (nuovo), `js/app.js`, `js/menu.js`, `css/style.css`
- `js/search.js`: modulo di ricerca — cerca tra nomi viaggi, descrizioni, tag, caption foto, testi sezioni, nomi POI. Debounce input (~300ms). Rendering risultati raggruppati per tipo (viaggi, foto, sezioni)
- `js/app.js`: aggiungere rotta `#search` al routing
- `js/menu.js`: collegare il bottone "Search" alla rotta `#search`
- Stato vuoto con suggerimenti, stato "nessun risultato" con messaggio friendly
- Click su risultato viaggio -> naviga a `#trip/<id>`. Click su risultato foto -> apre lightbox
- `css/style.css`: stili input ricerca, lista risultati, highlight del termine cercato, responsive

**Verifica:** Click sull'icona Search nella bottom nav -> si apre la vista ricerca. Digitare "Giappone" -> appaiono risultati in tempo reale. Cercare "tempio" -> mostra foto con caption corrispondente e sezioni con testo corrispondente. Click su un risultato naviga correttamente. Input vuoto mostra suggerimenti.

---

### Step 11 — [DONE] Sezione About
**Obiettivo:** Aggiungere una pagina "Chi sono" raggiungibile dalla navbar.
**File coinvolti:** `js/app.js`, `js/menu.js`, `css/style.css`
- `js/app.js`: aggiungere rotta `#about` al routing
- `js/menu.js`: aggiungere link "About" nella navbar
- Contenuto: bio, foto profilo (placeholder), link social
- `css/style.css`: layout sezione about, responsive

**Verifica:** Click "About" nella navbar -> si apre la sezione. Deep linking `#about` funziona. Bottone per tornare alla home.

---

### Step 12 — [DONE] Footer migliorato
**Obiettivo:** Ridisegnare il footer con layout a 3 colonne e banda decorativa.
**File coinvolti:** `index.html`, `css/style.css`
- **Colonna 1:** Logo "Surprise" + tagline
- **Colonna 2:** Link rapidi (Home, Viaggi recenti, About)
- **Colonna 3:** Social icons + email contatto
- Banda decorativa superiore: gradient/pattern che crea continuita col contenuto
- Copyright in fondo centrato
- Responsive: 3 colonne su desktop, stack verticale su mobile
- Coerente col tema dark/light

**Verifica:** Il footer mostra le 3 colonne con tutti i contenuti. I link funzionano. Su mobile le colonne si impilano. Il tema dark/light si applica correttamente.

---

### Step 13 — [DONE] Admin: login e routing
**Obiettivo:** Implementare l'autenticazione e la rotta `#admin`.
**File coinvolti:** `js/auth.js`, `js/app.js`, `css/style.css`
- `js/auth.js`: hash SHA-256 delle credenziali (`Admin`/`Admin`), funzione di verifica, gestione sessione in `sessionStorage`
- **Nota:** protezione cosmetica/deterrente — credenziali e hash sono nel JS client-side. Non e' sicurezza reale.
- `js/app.js`: aggiungere rotta `#admin` — se non autenticato mostra il login, se autenticato mostra il pannello
- `css/style.css`: stili form login (centrato, card con ombra, input stilizzati, errore inline)
- Il form login mostra un messaggio di errore se le credenziali sono sbagliate

**Verifica:** Navigare a `#admin` -> appare il form login. Credenziali errate -> messaggio errore. Username `Admin` + password `Admin` -> accesso al pannello. Chiudere il tab e riaprire -> serve nuovo login.

---

### Step 14 — [DONE] Admin: dashboard e trip editor
**Obiettivo:** Pannello admin con dashboard e gestione viaggi, con persistenza in localStorage.
**File coinvolti:** `js/admin.js`, `css/style.css`
- Dashboard: contatori (viaggi pubblicati, draft, foto totali, tag), lista viaggi con badge stato
- Trip editor: form per creare/modificare un viaggio (nome, data, color picker, descrizione, heroImage, tags, toggle published)
- Modifica inline dalla lista viaggi
- Bottone logout nella navbar admin
- **Persistenza localStorage:** le modifiche fatte nell'admin vengono salvate in `localStorage` oltre che in memoria, cosi non si perdono tra sessioni senza dover esportare ogni volta

**Verifica:** La dashboard mostra le statistiche corrette. Creare un viaggio -> appare nella lista. Modificare un campo -> il dato si aggiorna. Toggle published -> il badge cambia. I draft non appaiono nel sito pubblico. Chiudere e riaprire il tab -> le modifiche sono ancora presenti.

---

### Step 15 — [DONE] Admin: section editor e photo organizer
**Obiettivo:** Gestione sezioni split e foto dall'admin.
**File coinvolti:** `js/admin.js`, `css/style.css`
- **Section editor**: per ogni viaggio, lista sezioni con aggiungi/rimuovi/riordina. Per ogni sezione: tipo (text-image/image-text), titolo, testo, media (tipo image/video, src, caption/poster)
- **Photo organizer**: per ogni viaggio, griglia foto con drag & drop per riordinare (solo desktop), **bottoni su/giu come fallback su mobile/touch**, modifica caption inline, scelta cover, broken image checker (evidenzia foto con URL rotto)

**Verifica:** Le sezioni si aggiungono/rimuovono/riordinano. Cambiare tipo inverte il layout. Le foto si riordinano con drag & drop (desktop) o bottoni (mobile). Caption si modifica inline. Broken checker segnala immagini inesistenti.

---

### Step 16 — [DONE] Admin: POI editor e tag manager
**Obiettivo:** Gestione punti di interesse e tag dall'admin.
**File coinvolti:** `js/admin.js`, `css/style.css`
- **POI editor**: per ogni viaggio, lista POI con campi lat/lng, nome, icona (select con categorie), nota. Aggiunta/rimozione. Mini-preview mappa Leaflet che mostra il punto sulla mappa
- **Tag manager**: lista tag con conteggio viaggi, rinomina, elimina, segnalazione tag non usati

**Verifica:** I POI si aggiungono con coordinate. La mini-mappa mostra il marker. Modificare un POI aggiorna la preview. Il tag manager mostra conteggi corretti, rinomina aggiorna tutti i viaggi.

---

### Step 17 — [DONE] Admin: esporta/importa dati (JSON)
**Obiettivo:** Permettere backup, ripristino e trasferimento dei dati tra browser/dispositivi.
**File coinvolti:** `js/admin.js`, `js/data.js`
- Bottone "Esporta JSON": serializza `trips` e scarica un file `trips-backup-YYYY-MM-DD.json`
- Bottone "Importa JSON": carica un file `.json`, valida la struttura (array, campi obbligatori `id`, `name`, `date`), conferma sovrascrittura, aggiorna localStorage tramite `saveTrips()`
- Bottone "Reset ai default": ripristina i `defaultTrips` originali da `data.js` con conferma modale
- Feedback visivo: toast di conferma per export/import/reset, errori di validazione sull'import

**Verifica:** Esportare -> il file scaricato e' un `.json` valido con l'array trips. Importare il file appena esportato -> i dati si caricano correttamente. Reset -> tornano i 3 viaggi di default. Importare un file malformato -> errore chiaro, dati invariati.

---

### Step 18 — [DONE] Accessibilita (a11y)
**Obiettivo:** Rendere il sito accessibile e navigabile da tastiera.
**File coinvolti:** tutti
- `aria-label` su tutti i controlli interattivi (toggle tema, hamburger, lightbox, filtri)
- Focus trap nel lightbox (Tab cicla solo tra i controlli del lightbox)
- Link `skip-to-content` nascosto, visibile on focus
- Ruoli ARIA: `role="dialog"` per lightbox, `aria-expanded` per dropdown
- Outline di focus personalizzato e visibile su tutti gli elementi interattivi

**Verifica:** Navigare l'intero sito usando solo la tastiera (Tab, Enter, Escape, frecce). Screen reader legge correttamente ruoli e label. Il lightbox intrappola il focus.

---

### Step 19 — Polish, animazioni e SEO
**Obiettivo:** Rifinitura finale dell'esperienza utente.
**File coinvolti:** tutti
- Lazy loading immagini (`loading="lazy"`)
- Animazioni di entrata card (fade-in/slide-up con IntersectionObserver)
- Responsive tuning finale (375px, 768px, 1440px)
- Favicon e meta tag Open Graph
- Meta tag SEO: `<title>` dinamico (gia gestito nello Step 6), `<meta name="description">`, Open Graph tags
- Pulizia codice e test finale

**Verifica:** Tutte le verifiche degli step precedenti passano. Le animazioni sono fluide. Il sito e' usabile su mobile, tablet e desktop. I meta tag sono presenti e corretti.

---

## Come aggiungere un nuovo viaggio

1. Aprire `js/data.js`
2. Aggiungere un nuovo oggetto all'array `trips`:
   ```js
   {
     id: "nome-viaggio",        // ID univoco, usato nell'URL (#trip/nome-viaggio)
     name: "Nome Viaggio",      // Nome visualizzato
     date: "2025-06",           // Data (YYYY-MM)
     color: "#FF6B35",          // Colore accento (hex)
     cover: "assets/photos/nome-viaggio/cover.jpg",
     heroImage: "assets/photos/nome-viaggio/hero.jpg",
     description: "Breve descrizione del viaggio",
     tags: ["natura", "europa"],  // Tag per il filtraggio
     published: true,              // false = draft, visibile solo nell'admin
     sections: [
       {
         type: "text-image",
         title: "Titolo sezione",
         text: "Testo narrativo...",
         media: { type: "image", src: "assets/photos/nome-viaggio/05.jpg", caption: "Didascalia" }
       }
     ],
     pois: [
       { lat: 45.0, lng: 7.0, name: "Punto di interesse", icon: "nature", note: "Descrizione" }
     ],
     photos: [
       { src: "assets/photos/nome-viaggio/01.jpg", caption: "Didascalia foto" },
       // ...altre foto
     ]
   }
   ```
3. Creare la cartella `assets/photos/nome-viaggio/` e inserire le foto
4. Ricaricare il sito — il nuovo viaggio appare automaticamente nel menu e nella landing

> **In alternativa:** usa il pannello admin (`#admin`) per creare il viaggio visualmente, poi esporta il file `data.js` aggiornato.
