# PLAN 1.0 — Miglioramenti Surprise Travel Photography

## Contesto

Il sito Surprise e' completamente funzionante (v1.0): SPA vanilla JS con routing hash, pannello admin, mappa Leaflet, ricerca, tema dark/light, accessibilita'. Questo piano definisce i miglioramenti post-lancio, organizzati in 5 aree: Grafica, Implementazione, Sicurezza, Deploy, Funzionalita' aggiuntive.

**Stato attuale:**
- 11 moduli JS (~3300 righe), 1 file CSS (~4125 righe)
- Nessun build process, nessun test, nessun deploy automatico
- Admin con credenziali hash client-side (protezione cosmetica)
- Dati in localStorage, sessione in sessionStorage

---

## Area A — Grafica e Design

### Step A1 — [DONE] Splitting CSS in moduli tematici
**Obiettivo:** Suddividere `style.css` (4125 righe) in file CSS modulari importati via `@import`, migliorando manutenibilita' senza richiedere un bundler.
**File coinvolti:** `css/style.css` (da suddividere), nuovi: `css/reset.css`, `css/tokens.css`, `css/layout.css`, `css/components.css`, `css/hero.css`, `css/gallery.css`, `css/lightbox.css`, `css/search.css`, `css/admin.css`, `css/responsive.css`, `index.html`
- Estrarre le sezioni logiche gia' delimitate dai commenti `/* ===== ... ===== */`
- `css/style.css` diventa un file indice con solo `@import` ordinati
- Reset + tokens + base in testa, responsive in coda
- Nessun cambio funzionale: il rendering deve essere identico

**Nota implementazione:** Aggiunto `css/pages.css` (about teaser, about page, 404) per mantenere `components.css` sotto 500 righe. `admin.css` (1754 righe) resta sopra la soglia — verra' suddiviso nello step B1 insieme a `admin.js`.

**Verifica:** Il sito appare identicamente a prima. Ogni file CSS e' sotto le 500 righe. `@import` funziona nativamente nel browser. DevTools mostra i file sorgente separati.

---

### Step A2 — Aspect ratio e skeleton loading per le immagini
**Obiettivo:** Eliminare il CLS (Cumulative Layout Shift) riservando lo spazio delle immagini prima del caricamento, e mostrare placeholder shimmer durante il loading.
**File coinvolti:** `css/components.css`, `js/gallery.js`, `js/app.js`
- Aggiungere `aspect-ratio: 4/3` ai wrapper delle immagini (trip card, galleria, hero)
- Creare classe CSS `.skeleton` con animazione shimmer (gradient animato)
- Su `load` dell'immagine, rimuovere la classe skeleton
- Applicare anche a moments strip e sezioni split

**Verifica:** Ricaricare con throttling "Slow 3G": gli spazi delle immagini sono gia' riservati (nessun salto del layout). Il placeholder shimmer e' visibile durante il caricamento. Lighthouse CLS score migliora.

---

### Step A3 — Hero slideshow migliorato con transizioni avanzate
**Obiettivo:** Sostituire il fade basico dello slideshow hero con transizioni cinematiche (Ken Burns zoom + crossfade).
**File coinvolti:** `js/app.js`, `css/hero.css`
- Animazione Ken Burns (zoom lento + pan) su ogni slide attiva via CSS `@keyframes`
- Crossfade con `opacity` + `transition` tra slide
- Indicatori dot in basso per navigare tra slide
- Pausa automatica on hover/focus
- Testo hero con animazione di entrata staggered (titolo, poi sottotitolo, poi CTA)

**Verifica:** Lo slideshow ha un effetto zoom lento su ogni foto. Le transizioni sono fluide. I dot funzionano. Hover mette in pausa. Le animazioni testo sono staggered.

---

### Step A4 — Lightbox avanzato con zoom e gesture touch
**Obiettivo:** Trasformare il lightbox in esperienza immersiva con zoom, swipe gesture su mobile e transizioni migliori.
**File coinvolti:** `js/gallery.js`, `css/lightbox.css`
- Zoom su doppio click/pinch (CSS `transform: scale()` + `transform-origin` al punto di click)
- Swipe gesture su touch: swipe left/right per navigare (`touchstart`/`touchmove`/`touchend`)
- Transizione entrata: la foto "si espande" dalla thumbnail (`getBoundingClientRect()` della thumbnail, animare verso il centro)
- Preload della foto precedente e successiva
- Indicatore di caricamento (spinner) per immagini lente

**Verifica:** Desktop: doppio click zooma, mouse panna. Mobile: swipe naviga, pinch zooma. La transizione parte dalla thumbnail. Foto adiacenti pre-caricate. Spinner per immagini lente.

---

### Step A5 — Micro-interazioni e transizioni di pagina
**Obiettivo:** Aggiungere feedback visivi sottili e transizioni di navigazione sofisticate.
**File coinvolti:** `css/components.css`, `css/layout.css`, `js/app.js`, `js/gallery.js`
- Trip card hover: parallax tilt leggero (CSS `perspective` + `transform: rotateX/Y` basato su posizione mouse)
- Bottoni e link: effetto ripple on click (pseudo-elemento animato)
- Transizione tra viste: slide direzionale (home scorre a sinistra entrando in un trip, trip scorre a destra tornando)
- Filter bar: animazione smooth delle card con FLIP technique (First, Last, Invert, Play)
- Moments strip: drag-to-scroll su desktop + indicatori di scroll laterali

**Verifica:** Hover sulle card produce effetto 3D. Click su bottoni mostra ripple. Navigazione home/trip produce slide direzionale. Card si riposizionano con animazione al filtro. Moments strip si trascina col mouse su desktop.

---

### Step A6 — Restyling footer e pagina About
**Obiettivo:** Rendere il footer piu' visivamente interessante e arricchire la pagina About.
**File coinvolti:** `css/layout.css`, `js/app.js`, `index.html`
- Footer: mappa del mondo stilizzata (SVG inline) con punti colorati sui paesi visitati, animati all'entrata
- Footer: gradiente animato nella banda decorativa superiore
- About: layout narrativo con timeline dei viaggi (verticale, pallini colorati per viaggio)
- About: sezione "Equipment" con icone attrezzatura fotografica
- About: contatore statistiche animato (km percorsi, foto scattate, paesi visitati)

**Verifica:** Footer mostra mappa stilizzata con animazione. About ha timeline verticale dei viaggi. Statistiche si animano allo scroll. Responsive e coerente col tema dark/light.

---

### Step A7 — Progress bar di lettura e back-to-top
**Obiettivo:** Aggiungere indicatore di progresso nella lettura e bottone per tornare in cima.
**File coinvolti:** `js/app.js` (o nuovo `js/ui.js`), `css/components.css`
- Barra di progresso sottile in cima (sotto topbar) che si riempie con lo scroll, colorata con `--trip-color`
- Bottone "torna in cima" che appare dopo 300px di scroll, con animazione entrata/uscita
- Smooth scroll nativo (`window.scrollTo({ top: 0, behavior: 'smooth' })`)
- Visibili solo nelle pagine con contenuto lungo (trip, about)

**Verifica:** Scrollando un viaggio, la barra in cima si riempie proporzionalmente. Dopo 300px appare back-to-top con animazione. Click scrolla in cima. La barra usa il colore del viaggio.

---

## Area B — Implementazione e Architettura

### Step B1 — Splitting admin.js in sotto-moduli
**Obiettivo:** Suddividere `admin.js` (1152 righe) in moduli separati per responsabilita'.
**File coinvolti:** `js/admin.js` (da suddividere), nuovi: `js/admin/dashboard.js`, `js/admin/trip-editor.js`, `js/admin/section-editor.js`, `js/admin/photo-organizer.js`, `js/admin/poi-editor.js`, `js/admin/tag-manager.js`, `js/admin/data-manager.js`, `js/admin/index.js`, `js/admin/helpers.js`
- `js/admin/index.js`: orchestratore, gestisce tab switching, esporta `renderAdminPanel`
- Ogni sotto-modulo esporta la funzione di rendering del proprio tab
- Helpers condivisi (`escAttr`, `showToast`, `getAllTags`, `nameToId`, `POI_ICONS`) in `js/admin/helpers.js`
- Aggiornare `app.js` per importare da `js/admin/index.js`

**Verifica:** Admin funziona identicamente. Tutti i tab funzionano. Nessun file supera le 300 righe. `admin.js` originale non esiste piu'.

---

### Step B2 — Sanitizzazione HTML e protezione XSS completa
**Obiettivo:** Sostituire l'uso diretto di `innerHTML` con template sicuri, sanitizzando tutti i dati utente.
**File coinvolti:** tutti i file JS che usano `innerHTML`, nuovo `js/utils/sanitize.js`
- Funzione `escapeHtml(str)` che escapa `<`, `>`, `"`, `'`, `&`
- Applicare a tutti i dati utente interpolati in template HTML (caption, nomi, descrizioni, testi, note POI, tag)
- Validare URL immagini: accettare solo `https://`, percorsi relativi, `data:image/*` — rifiutare `javascript:`, `data:text/html`
- I dati vengono sanitizzati al rendering, non al salvataggio

**Verifica:** Creare viaggio con nome `<script>alert('xss')</script>` -> il nome appare come testo, nessun script eseguito. URL `javascript:` rifiutato. HTML nei campi caption non produce rendering HTML nel sito pubblico.

---

### Step B3 — Gestione errori globale e feedback utente
**Obiettivo:** Catturare eccezioni non gestite e mostrare feedback appropriato senza rompere il sito.
**File coinvolti:** nuovo `js/utils/error-handler.js`, `js/app.js`, `css/components.css`
- Listener `window.onerror` e `window.onunhandledrejection`
- Toast/snackbar riutilizzabile anche nel sito pubblico (non solo admin)
- Fallback graceful: se Leaflet non carica, mostrare "Mappa non disponibile" invece di errori
- Logging errori in console con formato strutturato

**Verifica:** Bloccare CDN Leaflet in DevTools -> sezione mappa mostra messaggio fallback. Errore JS -> toast con messaggio generico. Console mostra errore strutturato. Resto della pagina funziona.

---

### Step B4 — Stato filtri nell'URL e deep linking
**Obiettivo:** Persistere stato dei filtri nell'URL hash per link condivisibili.
**File coinvolti:** `js/filters.js`, `js/app.js`
- Codificare filtri come query parameters: `#?tag=asia&sort=recent`
- Al caricamento, leggere parametri e applicare filtri
- Aggiornare hash senza re-render completo (`history.replaceState`)
- Reset filtri rimuove i parametri

**Verifica:** Filtro "asia" + "recenti" -> URL diventa `#?tag=asia&sort=recent`. Aprire URL in nuovo tab -> filtri applicati. Reset -> URL torna a `#`. Back del browser ripristina i filtri.

---

### Step B5 — Virtual scrolling per gallerie grandi
**Obiettivo:** Rendering lazy delle foto per gallerie con molte immagini.
**File coinvolti:** `js/gallery.js`, `css/gallery.css`
- Per gallerie >20 foto: rendering iniziale di 12, poi caricamento progressivo con IntersectionObserver
- Placeholder skeleton per foto non ancora renderizzate
- Contatore "Mostrando X di Y foto" + pulsante "Carica tutte"
- Scroll position preservation al ritorno dalla lightbox

**Verifica:** Viaggio con 50+ foto -> solo 12 renderizzate. Scrollando, altre appaiono. Contatore si aggiorna. "Carica tutte" mostra tutto. Lightbox mantiene posizione scroll.

---

### Step B6 — Validazione dati e schema
**Obiettivo:** Validazione strutturale dei dati per prevenire errori silenti e dati corrotti.
**File coinvolti:** nuovo `js/utils/validator.js`, `js/data.js`, `js/admin/trip-editor.js`
- Schema con regole (campi obbligatori, tipi, range lat/lng, formati data, lunghezze max)
- `validateTrip(trip)` -> `{ valid: boolean, errors: string[] }`
- Validazione all'import JSON con errori specifici
- Nel trip editor: campi invalidi con bordo rosso e messaggio inline
- Non salvare dati corrotti in localStorage

**Verifica:** Import JSON senza `id` -> errore "Campo 'id' obbligatorio". Latitudine 999 -> messaggio "Latitudine tra -90 e 90". Campi validi -> nessun errore.

---

### Step B7 — Undo/redo nell'admin
**Obiettivo:** Sistema di annullamento/ripetizione per operazioni admin.
**File coinvolti:** nuovo `js/admin/history.js`, `js/admin/index.js`, sotto-moduli admin, `css/admin.css`
- Stack history con snapshot (max 50 stati)
- Snapshot prima di ogni operazione mutante
- Bottoni Undo/Redo + shortcut `Ctrl+Z` / `Ctrl+Shift+Z`
- Badge con numero di operazioni annullabili
- Stack si resetta al logout

**Verifica:** Eliminare viaggio -> Undo -> riappare. Modificare nome 3 volte -> Undo 3 volte -> nome originale. Ctrl+Z funziona. Badge con conteggio corretto.

---

### Step B8 — Operazioni batch nel photo organizer
**Obiettivo:** Operazioni su piu' foto contemporaneamente nell'admin.
**File coinvolti:** `js/admin/photo-organizer.js`, `css/admin.css`
- Checkbox per selezione + "Seleziona tutte" / "Deseleziona tutte"
- Azioni batch: elimina, sposta in altro viaggio, modifica caption (prefisso/suffisso)
- Conferma modale prima di eliminazione batch
- Counter "X foto selezionate" nella toolbar

**Verifica:** Selezionare 5 foto -> counter "5 foto selezionate". Elimina selezionate -> conferma -> rimosse. Seleziona tutte funziona. Batch caption aggiunge prefisso a tutte.

---

## Area C — Sicurezza

### Step C1 — Sanitizzazione URL e Content Security Policy
**Obiettivo:** Validare URL immagini e aggiungere CSP.
**File coinvolti:** `js/utils/sanitize.js`, `index.html`
- `isValidImageUrl(url)`: accetta `https://`, relativi, `data:image/*` — rifiuta `javascript:`, `data:text/html`
- Applicare ovunque si inseriscono URL (admin, import JSON)
- Meta tag CSP in `index.html`: `default-src 'self'; img-src 'self' https: data:; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com`
- Aggiungere `integrity` e `crossorigin` al CSS Google Fonts

**Verifica:** `javascript:alert(1)` come URL -> rifiutato. CSP attiva senza warning per risorse normali. CDN con SRI. URL `https://picsum.photos/...` accettato.

---

### Step C2 — Rate limiting login e scadenza sessione
**Obiettivo:** Limitare tentativi login e aggiungere scadenza sessione admin.
**File coinvolti:** `js/auth.js`
- Dopo 5 tentativi falliti, blocco 60 secondi con countdown
- Contatore tentativi in `sessionStorage`
- Scadenza sessione: timestamp login, verifica che non siano passate >2 ore
- Sessione scaduta -> toast "Sessione scaduta" + redirect login
- Logout automatico dopo 30 minuti di inattivita' (reset timer su click/keypress)

**Verifica:** 5 credenziali errate -> blocco con countdown "Riprova tra 60s". Countdown finito -> form sbloccato. Dopo 2 ore -> redirect login. 30 min inattivita' -> logout automatico.

---

### Step C3 — Audit log operazioni admin
**Obiettivo:** Registrare tutte le operazioni admin per tracciabilita'.
**File coinvolti:** nuovo `js/admin/audit-log.js`, `js/admin/index.js`, sotto-moduli admin, `css/admin.css`
- Ogni operazione genera record: `{ timestamp, action, target, details }`
- Log in `localStorage` (chiave separata, max 500 record con rotazione FIFO)
- Tab "Attivita'" nel pannello admin con lista cronologica
- Filtri per tipo di azione e ricerca testuale
- Bottone "Esporta log" in JSON

**Verifica:** Creare viaggio -> log registra "Viaggio 'Norvegia' creato". Eliminare foto -> log registra. Tab Attivita' mostra tutto in ordine. Export scarica JSON valido.

---

## Area D — Deploy e Infrastruttura

### Step D1 — Build script con minificazione
**Obiettivo:** Processo di build che produce versione ottimizzata per produzione.
**File coinvolti:** `package.json`, nuovo `build.js`, nuova cartella `dist/`
- Script Node.js: concatena/minifica CSS (rimuove commenti, spazi), minifica JS con `terser` (devDependency), copia `index.html` con riferimenti aggiornati, copia `assets/`
- Output in `dist/` (aggiungere a `.gitignore`)
- Script npm: `"build": "node build.js"`
- File `dist/version.txt` con hash build e timestamp
- Mantenere ES modules (non bundlare in singolo file)

**Verifica:** `npm run build` produce `dist/` con file minificati. `dist/index.html` con server locale funziona identicamente. File CSS/JS significativamente piu' piccoli. Nessun errore in console.

---

### Step D2 — PWA manifest e service worker
**Obiettivo:** Sito installabile come PWA e funzionante offline (almeno la shell).
**File coinvolti:** nuovo `manifest.json`, nuovo `sw.js`, `index.html`, `js/app.js`
- `manifest.json`: nome, icone (192x192 e 512x512), colori tema, `start_url`, `display: "standalone"`
- `sw.js`: cache-first per asset statici, network-first per dati dinamici
- Pre-cache shell (index.html, CSS, JS, font) al primo install
- Cache immagini on-demand
- Pagina offline fallback
- Registrazione service worker in `app.js`

**Verifica:** Chrome DevTools > Application > Manifest mostra dati corretti. Prompt "Aggiungi a schermata Home" disponibile. Offline -> shell si carica, pagine gia' visitate disponibili. Pagine non in cache -> fallback offline.

---

### Step D3 — GitHub Actions CI/CD
**Obiettivo:** Automazione validazione codice e deploy su GitHub Pages.
**File coinvolti:** nuovo `.github/workflows/ci.yml`, nuovo `.github/workflows/deploy.yml`, `package.json`
- CI (su push/PR): lint HTML (htmlhint), CSS (stylelint), JS (eslint), build
- Deploy (su push a `main`): build + deploy `dist/` su GitHub Pages
- DevDependencies: `eslint`, `stylelint`, `htmlhint`
- Config linter: `.eslintrc.json`, `.stylelintrc.json`, `.htmlhintrc`
- Script npm: `"lint"`, `"ci": "npm run lint && npm run build"`

**Verifica:** Push su branch -> CI esegue lint + build. Lint fallito -> CI rossa. Merge su `main` -> deploy automatico. Sito raggiungibile su GitHub Pages.

---

### Step D4 — SEO avanzato e meta tag social
**Obiettivo:** Migliorare visibilita' motori di ricerca e anteprime social.
**File coinvolti:** `index.html`, `js/app.js`, nuovi: `sitemap.xml`, `robots.txt`
- `sitemap.xml` con rotte principali
- `robots.txt` con `Allow: /` e riferimento sitemap
- JSON-LD structured data (Schema.org `WebSite` + `ImageGallery`) iniettato dinamicamente
- Meta tag `og:image`, `og:description` aggiornati al cambio viaggio
- `<meta name="twitter:card" content="summary_large_image">` e tag Twitter

**Verifica:** `sitemap.xml` valido. Preview social mostra titolo/descrizione/immagine del viaggio. JSON-LD valido su Google Rich Results Test. `robots.txt` accessibile.

---

### Step D5 — Monitoraggio performance
**Obiettivo:** Misurare performance del sito con Web Vitals.
**File coinvolti:** nuovo `js/utils/performance.js`, `js/app.js`
- Raccogliere Web Vitals (LCP, FID, CLS, TTFB) via `PerformanceObserver` nativa
- Log in console (dev mode) con codice colore (verde/giallo/rosso)
- Predisposizione per endpoint analytics (commentato)
- Placeholder per analytics privacy-friendly (Plausible/Umami) con istruzioni
- `performance.mark()` nei punti chiave di rendering

**Verifica:** Console mostra Web Vitals con colori. LCP, CLS, FID visibili. `performance.mark()` nel tab Performance di DevTools.

---

## Area E — Funzionalita' aggiuntive

### Step E1 — Breadcrumbs e navigazione migliorata
**Obiettivo:** Aggiungere breadcrumbs per orientare l'utente.
**File coinvolti:** `js/app.js`, `css/components.css`
- Breadcrumb sotto topbar: `Home > Giappone`
- Generazione automatica dalla rotta hash
- Link cliccabili su ogni livello
- Schema.org `BreadcrumbList` in JSON-LD
- Nascosto sulla home
- Mobile: solo "← Indietro"

**Verifica:** `#trip/giappone` -> "Home > Giappone". Click "Home" riporta alla landing. Mobile -> "← Indietro". Nessun breadcrumb sulla home.

---

### Step E2 — Viaggi correlati e suggerimenti
**Obiettivo:** Suggerire viaggi correlati per tag al fondo di ogni pagina viaggio.
**File coinvolti:** `js/gallery.js`, `css/components.css`
- Sezione "Potrebbe interessarti" dopo la mappa, max 3 card
- Correlazione: viaggi con piu' tag in comune (escluso il corrente)
- Fallback: viaggi piu' recenti se nessuna correlazione
- Card compatte con tag condivisi evidenziati
- Animazione entrata allo scroll

**Verifica:** Pagina Giappone (asia, cultura, citta) -> suggerimenti con tag in comune evidenziati. Nessuna correlazione -> mostra i recenti. Non appare se c'e' un solo viaggio.

---

### Step E3 — Condivisione social
**Obiettivo:** Bottoni share sulle pagine viaggio.
**File coinvolti:** `js/gallery.js`, `css/components.css`
- Bottoni nella hero: WhatsApp, Twitter/X, Facebook, copia link
- API `navigator.share` su mobile come opzione primaria
- Fallback: link diretti `https://twitter.com/intent/tweet?url=...`
- "Copia link" con feedback "Copiato!" via `navigator.clipboard.writeText()`
- Animazione staggered dei bottoni

**Verifica:** Desktop: 4 bottoni visibili. "Copia link" -> toast "Copiato!". WhatsApp -> apre con messaggio. Mobile -> foglio condivisione nativo (se supportato).

---

### Step E4 — Print stylesheet
**Obiettivo:** Foglio di stile per stampa leggibile e pulita.
**File coinvolti:** nuovo `css/print.css`, `index.html`
- `<link rel="stylesheet" href="css/print.css" media="print">`
- Nascondere: navbar, footer, filtri, lightbox, mappa, bottoni, animazioni
- Mostrare: titolo, descrizione, sezioni, galleria compatta, didascalie
- Font serif, scala di grigi
- Interruzioni pagina sensate (`page-break-inside: avoid`)

**Verifica:** Ctrl+P -> anteprima mostra contenuto leggibile. Nessun elemento interattivo. Immagini inline. Testo in serif. Interruzioni di pagina sensate.

---

### Step E5 — Shortcut da tastiera e guida
**Obiettivo:** Scorciatoie tastiera per navigazione avanzata.
**File coinvolti:** nuovo `js/utils/keyboard.js`, `js/app.js`, `css/components.css`
- Globali: `?` guida, `/` ricerca, `h` home, `t` tema, `Esc` chiude overlay
- In pagina viaggio: `j`/`k` scorrere sezioni, `g` galleria, `m` mappa
- Overlay modale guida con tabella shortcut
- Disattivate quando focus su input/textarea
- Indicatore discreto "Premi ? per le scorciatoie"

**Verifica:** `?` -> guida. `/` -> ricerca con focus su input. `h` -> home. `j`/`k` scorrono sezioni. Digitare in input -> shortcut non attive. Indicatore scompare dopo primo uso.

---

### Step E6 — Preferiti/bookmarks per visitatori
**Obiettivo:** Salvare viaggi preferiti e ritrovarli facilmente.
**File coinvolti:** nuovo `js/utils/favorites.js`, `js/gallery.js`, `js/app.js`, `css/components.css`
- Icona cuore su trip card e hero viaggio
- Toggle preferito, array ID in `localStorage`
- Animazione cuore al click (pulse + fill)
- Counter nella bottom nav (badge numerico)
- Vista "Preferiti" con solo viaggi salvati
- Stato vuoto: "Non hai ancora salvato nessun viaggio"

**Verifica:** Click cuore -> icona animata, diventa piena. Reload -> ancora preferito. Vista Preferiti -> viaggio presente. Rimuovere -> scompare. Badge mostra conteggio.

---

### Step E7 — Pagina 404 migliorata
**Obiettivo:** Ridisegnare la 404 con personalita' e utilita'.
**File coinvolti:** `js/app.js`, `css/components.css`
- Illustrazione SVG animata a tema viaggio (bussola, valigia persa)
- Messaggio spiritoso: "Sembra che ti sia perso... ma non preoccuparti, anche i migliori esploratori si perdono!"
- Suggerimenti: link home, viaggi recenti, barra ricerca inline
- Colori del tema attivo
- Animazione entrata staggered

**Verifica:** `#rotta-inesistente` -> 404 con illustrazione, messaggio e suggerimenti. Link funzionano. Ricerca dalla 404. Responsive e coerente col tema.

---

## Ordine di esecuzione consigliato

Le aree possono essere lavorate in parallelo, ma all'interno di ogni area gli step sono sequenziali.

**Priorita' alta (fondamenta):**
1. **A1** — CSS splitting (manutenibilita' per tutto il resto)
2. **B1** — Admin splitting (stesso motivo)
3. **B2** — Sanitizzazione XSS (sicurezza critica)
4. **C1** — URL validation + CSP (sicurezza)

**Priorita' media (impatto UX e infrastruttura):**
5. **A2** — Skeleton loading (impatto UX immediato)
6. **D1** — Build script (necessario per D3)
7. **D3** — CI/CD (automazione)
8. **C2** — Rate limiting login
9. **A3-A7** — Miglioramenti grafici (in ordine)
10. **B3-B8** — Miglioramenti architetturali (in ordine)

**Priorita' normale (polish e funzionalita'):**
11. **D2, D4, D5** — PWA, SEO, analytics
12. **C3** — Audit log
13. **E1-E7** — Funzionalita' aggiuntive (in ordine di interesse)
