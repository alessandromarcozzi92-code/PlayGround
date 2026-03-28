# Piano: Sito Web Travel Photography

## Contesto
Alessandro vuole un sito personale per raccogliere le fotografie dei suoi viaggi. Il sito deve essere moderno, accattivante, con colori vividi. Ogni viaggio ha un colore identificativo. Stack: HTML + CSS + JS vanilla ES6+. Nessun framework UI, nessun bundler — sito statico puro, pronto per essere hostato ovunque.

**Preferenze utente:**
- Doppio tema dark/light con toggle switch, preferenza salvata in localStorage
- Navbar sticky che segue lo scroll della pagina (si riduce/cambia stile on scroll)
- Layout basato su Flexbox (no CSS Grid)

**Tooling:**
- npm per gestire gli script di sviluppo (`npm start` per il dev server)
- `lite-server` come dev server locale (supporta ES modules, live reload, zero config)

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
│   ├── auth.js             # Login admin: validazione credenziali, sessione
│   └── admin.js            # Pannello admin: dashboard, trip editor, tag manager
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
    description: "Tokyo, Kyoto e il Monte Fuji",
    tags: ["asia", "cultura", "citta"],
    published: true,              // false = visibile solo nell'admin (draft)
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

---

## Componenti principali

### 1. Navbar Sticky
- Posizione `fixed` in alto, segue lo scroll
- Contiene: logo/titolo, dropdown "Viaggi" (con dot colorato per ogni viaggio), toggle tema
- On scroll > 50px: si compatta (altezza ridotta, aggiunge `box-shadow`)
- Su mobile: hamburger button -> menu a tendina fullwidth
- Il dropdown viaggi mostra un pallino colorato accanto a ogni nome

### 2. Landing Page (Hero + Trip Cards)
- **Sezione hero immersiva:** immagine/slideshow a tutto schermo delle migliori foto dei viaggi, con overlay sfumato, titolo grande e sottotitolo sovrapposti. Non un semplice titolo su sfondo piatto — la hero deve essere il pezzo forte del sito.
- Griglia di card, una per viaggio
- Ogni card: immagine cover, overlay gradient con nome + data, bordo bottom nel colore del viaggio
- Hover: leggero zoom immagine + glow con il colore del viaggio

### 3. Vista Galleria Viaggio
- Transizione dalla landing via hash routing (`#trip/giappone`)
- **Animazione di transizione:** fade-out della vista corrente, fade-in della nuova vista (non un semplice swap del DOM)
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

### 6. Filtri e ordinamento
- Barra filtri sopra le card nella landing: bottoni tag (es. "asia", "natura", "citta") + ordinamento per data (recenti/meno recenti)
- Click su un tag: filtra le card mostrando solo i viaggi con quel tag
- Filtro attivo evidenziato visivamente
- Animazione smooth quando le card appaiono/scompaiono

### 7. Contatore statistiche (Hero)
- Nella sezione hero, sotto il titolo: "X viaggi, Y paesi, Z foto"
- Contatori con animazione count-up al caricamento della pagina
- I valori sono calcolati dinamicamente dai dati in `data.js`

### 8. Sezione About
- Raggiungibile tramite link nella navbar e/o nel footer
- Breve bio, foto profilo, contatti/social
- Gestita come vista separata via hash routing (`#about`)

### 9. Footer
- Copyright e credits
- Link a sezione About e contatti/social
- Coerente col tema dark/light

### 10. Routing robusto
- Hash routing con gestione di rotte inesistenti (pagina 404 con messaggio e link alla home)
- `document.title` aggiornato dinamicamente per ogni vista (es. "Giappone — Surprise", "About — Surprise")
- Transizione animata tra le viste (fade-out/fade-in)

### 11. Gestione errori immagini (sito pubblico)
- Fallback/placeholder visivo per immagini che non caricano (`onerror` handler)
- Nessuna immagine rotta visibile all'utente — sempre un placeholder coerente col design

### 12. Pannello Admin (`#admin`)
- Rotta `#admin` — se non autenticato, mostra il form di login
- **Login**: form con username e password, credenziali verificate tramite hash SHA-256 confrontato con hash salvato come costante (credenziali iniziali: username `Admin`, password `Admin`)
- **Nota:** questa è una protezione cosmetica/deterrente, non sicurezza reale — le credenziali e l'hash sono nel JS client-side e bypassabili da chiunque apra la console
- **Sessione**: al login riuscito, salva un token di sessione in `sessionStorage` (scade alla chiusura del tab)
- **Dashboard**: panoramica rapida — n. viaggi (pubblicati/draft), n. foto totali, n. tag, foto per viaggio
- **Trip editor**: form visuale per creare/modificare un viaggio (nome, data, colore con color picker, descrizione, tags, published). Lista viaggi con badge "Draft"/"Pubblicato"
- **Photo organizer**: per ogni viaggio, lista foto con drag & drop per riordinare (solo desktop — su mobile usare bottoni su/giù come fallback), modifica caption inline, scelta cover, segnalazione immagini rotte (broken image checker)
- **Tag manager**: lista tag con conteggio viaggi per tag, rinomina, elimina, merge tag duplicati
- **Persistenza intermedia**: le modifiche fatte nell'admin vengono salvate in `localStorage` oltre che in memoria, così non si perdono tra una sessione e l'altra senza dover esportare ogni volta
- **Esporta/Importa**: bottone "Esporta data.js" scarica il file aggiornato. Bottone "Importa JSON" carica dati da file
- **Logout**: torna alla home pubblica, cancella sessione

### 13. Accessibilita (a11y)
- `aria-label` su tutti i controlli interattivi (toggle tema, hamburger, lightbox, filtri)
- Focus trap nel lightbox (Tab cicla solo tra i controlli del lightbox)
- `skip-to-content` link nascosto, visibile on focus
- Ruoli ARIA: `role="dialog"` per lightbox, `aria-expanded` per dropdown
- Focus visibile su tutti gli elementi interattivi (outline personalizzato)

---

## Moduli JavaScript

| Modulo | Responsabilita |
|--------|---------------|
| `data.js` | Esporta l'array `trips` |
| `app.js` | Entry point: inizializza tema, menu, routing. Ascolta `hashchange` per navigare tra landing e galleria. Gestisce 404 e aggiorna `document.title` |
| `theme.js` | Toggle dark/light, persistenza localStorage, rispetto `prefers-color-scheme` iniziale |
| `menu.js` | Genera navbar con dropdown viaggi, gestisce hamburger mobile, comportamento sticky on scroll |
| `gallery.js` | Renderizza trip cards (landing) e griglia foto (galleria), gestisce lightbox completo, gestisce fallback immagini rotte |
| `filters.js` | Filtraggio per tag e ordinamento per data sulla landing page |
| `stats.js` | Calcola e renderizza i contatori animati nella hero (viaggi, paesi, foto) |
| `auth.js` | Login admin: validazione credenziali via hash SHA-256, gestione sessione in sessionStorage |
| `admin.js` | Pannello admin: dashboard, trip editor, photo organizer, tag manager, esporta/importa |

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

### Step 5 — [DA RIVEDERE] Landing page con trip cards
**Obiettivo:** La home page mostra le card dei viaggi con una hero section immersiva.
**File coinvolti:** `js/gallery.js`, `css/style.css`

> **Da sistemare:** La hero section attuale è un semplice titolo + sottotitolo su sfondo piatto. Deve diventare immersiva: immagine/slideshow a tutto schermo con overlay sfumato e testo sovrapposto. Aggiungere anche un fallback `onerror` sulle immagini delle card per gestire foto che non caricano.

- `js/gallery.js`: funzione per renderizzare le trip card nel `<main>`
- Hero section immersiva: immagine/slideshow a tutto schermo delle migliori foto, overlay gradient, titolo e sottotitolo sovrapposti
- `css/style.css`: layout flex-wrap per le card, hover effects (scale, glow colorato), overlay gradient
- `js/app.js`: chiamare il rendering delle card all'avvio
- Fallback placeholder su immagini rotte (`onerror` handler)

**Verifica:** La hero cattura l'attenzione con un'immagine a tutto schermo. Le card appaiono in griglia, ogni card ha il suo colore accento sul bordo. L'hover mostra zoom e glow. Le foto placeholder da picsum si caricano correttamente. Le immagini rotte mostrano un placeholder coerente.

---

### Step 6 — [DA RIVEDERE] Routing e vista galleria viaggio
**Obiettivo:** Click su una card o voce menu porta alla galleria foto del viaggio, con routing robusto.
**File coinvolti:** `js/app.js`, `js/gallery.js`, `css/style.css`

> **Da sistemare:** Attualmente il routing non gestisce rotte inesistenti (es. `#trip/nonexistent` o `#invalid` ricadono silenziosamente sulla landing). Aggiungere: pagina 404 per rotte/trip non trovati, aggiornamento dinamico di `document.title` per ogni vista, e animazione di transizione fade tra le viste (non semplice swap del DOM).

- `js/app.js`: listener `hashchange`, logica routing (landing vs galleria vs 404)
- Gestione 404: se la rotta non esiste o il trip ID non è valido, mostrare una pagina "Non trovato" con link alla home
- `document.title` aggiornato dinamicamente: "Surprise — Travel Photography" per la landing, "Giappone — Surprise" per i trip, ecc.
- Animazione di transizione: fade-out della vista corrente → swap contenuto → fade-in della nuova vista
- `js/gallery.js`: funzione rendering galleria (header colorato + griglia foto flex)
- `css/style.css`: stili galleria, header con accento, griglia foto responsive, animazione transizione vista

**Verifica:** Click card -> URL cambia in `#trip/giappone` -> transizione animata -> appare la galleria con header colorato. Il titolo del browser cambia. `#trip/nonexistent` mostra pagina 404. Bottone "Torna" riporta alla landing. Ricaricare su `#trip/giappone` apre direttamente la galleria (deep linking).

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

### Step 9 — Contatore statistiche nella hero
**Obiettivo:** Mostrare statistiche animate nella sezione hero.
**File coinvolti:** `js/stats.js`, `js/app.js`, `css/style.css`
- `js/stats.js`: calcolo dinamico (n. viaggi, n. paesi/destinazioni, n. foto totali) + animazione count-up
- `js/app.js`: inizializzare i contatori al caricamento
- `css/style.css`: stili contatori nella hero

**Verifica:** La hero mostra "X viaggi, Y paesi, Z foto". I numeri si animano da 0 al valore finale al caricamento della pagina.

---

### Step 10 — Sezione About
**Obiettivo:** Aggiungere una pagina "Chi sono" raggiungibile dalla navbar.
**File coinvolti:** `js/app.js`, `js/menu.js`, `css/style.css`
- `js/app.js`: aggiungere rotta `#about` al routing
- `js/menu.js`: aggiungere link "About" nella navbar
- Contenuto: bio, foto profilo (placeholder), link social
- `css/style.css`: layout sezione about, responsive

**Verifica:** Click "About" nella navbar -> si apre la sezione. Deep linking `#about` funziona. Bottone per tornare alla home.

---

### Step 11 — Admin: login e routing
**Obiettivo:** Implementare l'autenticazione e la rotta `#admin`.
**File coinvolti:** `js/auth.js`, `js/app.js`, `css/style.css`
- `js/auth.js`: hash SHA-256 delle credenziali (`Admin`/`Admin`), funzione di verifica, gestione sessione in `sessionStorage`
- **Nota:** protezione cosmetica/deterrente — credenziali e hash sono nel JS client-side. Non è sicurezza reale.
- `js/app.js`: aggiungere rotta `#admin` — se non autenticato mostra il login, se autenticato mostra il pannello
- `css/style.css`: stili form login (centrato, card con ombra, input stilizzati, errore inline)
- Il form login mostra un messaggio di errore se le credenziali sono sbagliate

**Verifica:** Navigare a `#admin` -> appare il form login. Credenziali errate -> messaggio errore. Username `Admin` + password `Admin` -> accesso al pannello. Chiudere il tab e riaprire -> serve nuovo login.

---

### Step 12 — Admin: dashboard e trip editor
**Obiettivo:** Pannello admin con dashboard e gestione viaggi, con persistenza in localStorage.
**File coinvolti:** `js/admin.js`, `css/style.css`
- Dashboard: contatori (viaggi pubblicati, draft, foto totali, tag), lista viaggi con badge stato
- Trip editor: form per creare/modificare un viaggio (nome, data, color picker, descrizione, tags, toggle published)
- Modifica inline dalla lista viaggi
- Bottone logout nella navbar admin
- **Persistenza localStorage:** le modifiche fatte nell'admin vengono salvate in `localStorage` oltre che in memoria, così non si perdono tra sessioni senza dover esportare ogni volta

**Verifica:** La dashboard mostra le statistiche corrette. Creare un viaggio -> appare nella lista. Modificare un campo -> il dato si aggiorna. Toggle published -> il badge cambia. I draft non appaiono nel sito pubblico. Chiudere e riaprire il tab -> le modifiche sono ancora presenti.

---

### Step 13 — Admin: photo organizer e tag manager
**Obiettivo:** Gestione foto e tag dall'admin.
**File coinvolti:** `js/admin.js`, `css/style.css`
- Photo organizer: per ogni viaggio, griglia foto con drag & drop per riordinare (solo desktop), **bottoni su/giù come fallback su mobile/touch**, modifica caption inline, scelta cover, broken image checker (evidenzia foto con URL rotto)
- Tag manager: lista tag con conteggio viaggi, rinomina, elimina, segnalazione tag non usati

**Verifica:** Drag & drop riordina le foto (desktop). Bottoni su/giù funzionano su mobile. Caption si modifica inline. Broken checker segnala immagini inesistenti. Tag manager mostra conteggi corretti, rinomina aggiorna tutti i viaggi.

---

### Step 14 — Admin: esporta/importa dati
**Obiettivo:** Permettere l'esportazione e l'importazione dei dati.
**File coinvolti:** `js/admin.js`
- Bottone "Esporta data.js": genera e scarica il file `data.js` con la sintassi ES module corretta, pronto da sostituire nel progetto
- Bottone "Importa JSON": carica un file JSON, valida la struttura, e aggiorna i dati nel pannello
- Feedback visivo: conferma esportazione, errori di validazione sull'import

**Verifica:** Esportare -> il file scaricato e' un `data.js` valido con `export const trips = [...]`. Importare il file esportato -> i dati si caricano correttamente nell'admin.

---

### Step 15 — Accessibilita (a11y)
**Obiettivo:** Rendere il sito accessibile e navigabile da tastiera.
**File coinvolti:** tutti
- `aria-label` su tutti i controlli interattivi (toggle tema, hamburger, lightbox, filtri)
- Focus trap nel lightbox (Tab cicla solo tra i controlli del lightbox)
- Link `skip-to-content` nascosto, visibile on focus
- Ruoli ARIA: `role="dialog"` per lightbox, `aria-expanded` per dropdown
- Outline di focus personalizzato e visibile su tutti gli elementi interattivi

**Verifica:** Navigare l'intero sito usando solo la tastiera (Tab, Enter, Escape, frecce). Screen reader legge correttamente ruoli e label. Il lightbox intrappola il focus.

---

### Step 16 — Polish, animazioni e SEO
**Obiettivo:** Rifinitura finale dell'esperienza utente.
**File coinvolti:** tutti
- Lazy loading immagini (`loading="lazy"`)
- Animazioni di entrata card (fade-in/slide-up con IntersectionObserver)
- Responsive tuning finale (375px, 768px, 1440px)
- Favicon e meta tag Open Graph
- Meta tag SEO: `<title>` dinamico (già gestito nello Step 6), `<meta name="description">`, Open Graph tags
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
     description: "Breve descrizione del viaggio",
     tags: ["natura", "europa"],  // Tag per il filtraggio
     published: true,              // false = draft, visibile solo nell'admin
     photos: [
       { src: "assets/photos/nome-viaggio/01.jpg", caption: "Didascalia foto" },
       // ...altre foto
     ]
   }
   ```
3. Creare la cartella `assets/photos/nome-viaggio/` e inserire le foto
4. Ricaricare il sito — il nuovo viaggio appare automaticamente nel menu e nella landing

> **In alternativa:** usa il pannello admin (`#admin`) per creare il viaggio visualmente, poi esporta il file `data.js` aggiornato.
