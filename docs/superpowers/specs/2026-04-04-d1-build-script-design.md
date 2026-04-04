# D1 — Build Script con Minificazione

## Obiettivo

Creare un processo di build Node.js che produce una versione ottimizzata del sito in `dist/`, pronta per il deploy. Nessun bundler: solo `terser` come devDependency aggiuntiva.

## Decisioni chiave

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| CSS | Concatena `@import` in un singolo file minificato | `@import` CSS e' render-blocking e sequenziale; un file elimina 11 richieste |
| JS | Minifica ogni modulo separatamente, mantieni ES modules | HTTP/2 parallelizza; cache granulare; zero config bundler |
| Leaflet | Vendor locale (scaricato una tantum) | Zero dipendenze runtime; prepara PWA (D2); CSP piu' restrittiva |
| Minificazione CSS | Regex (no clean-css) | Sufficiente per ~4000 righe; zero dipendenze extra |

## Struttura output

```
dist/
  index.html            # riferimenti aggiornati
  css/
    style.min.css       # CSS concatenato + minificato
  js/
    app.js              # minificato con terser
    gallery.js
    auth.js
    data.js
    filters.js
    map.js
    menu.js
    search.js
    stats.js
    theme.js
    admin/
      index.js
      dashboard.js
      helpers.js
      photo-organizer.js
      poi-editor.js
      section-editor.js
      tag-manager.js
    utils/
      sanitize.js
      skeleton.js
  vendor/
    leaflet.js          # Leaflet 1.9.4 JS
    leaflet.css         # Leaflet 1.9.4 CSS
  assets/
    photos/             # copia diretta
  version.txt           # hash build + timestamp
```

## Fasi del build (`build.js`)

### 1. Clean

Rimuove `dist/` se esiste, ricrea la directory.

### 2. CSS — concatena e minifica

1. Legge `css/style.css`
2. Per ogni `@import url("file.css")` trovato, legge il file referenziato (path relativo a `css/`)
3. Sostituisce la direttiva `@import` col contenuto del file
4. Ripete ricorsivamente (non ci sono import annidati oggi, ma il codice lo supporta)
5. Minifica il risultato:
   - Rimuovi commenti `/* ... */` (regex: `/\/\*[\s\S]*?\*\//g`)
   - Rimuovi newline e tab
   - Comprimi spazi multipli in uno
   - Rimuovi spazi attorno a `{`, `}`, `:`, `;`, `,`
6. Scrive `dist/css/style.min.css`

### 3. JS — minifica con terser

1. Trova tutti i `.js` in `js/` ricorsivamente
2. Per ogni file, chiama `terser.minify()` con opzioni:
   - `module: true` (ES modules)
   - `compress: { passes: 2 }` (due passate di ottimizzazione)
   - `mangle: true` (rinomina variabili locali)
3. Scrive in `dist/js/` mantenendo la stessa struttura di directory
4. I path negli `import` restano invariati (stessa struttura relativa)

### 4. Vendor — copia Leaflet

Copia `vendor/leaflet.js` e `vendor/leaflet.css` dalla root in `dist/vendor/`.

Nota: Leaflet CSS resta separato (non concatenato in `style.min.css`) perche' ha path relativi interni per immagini dei marker.

Prerequisito: i file devono esistere in `vendor/` (vedi sezione Vendor Leaflet sotto).

### 5. HTML — copia e aggiorna riferimenti

Copia `index.html` in `dist/`, con queste sostituzioni:

| Originale | Produzione |
|-----------|-----------|
| `href="css/style.css"` | `href="css/style.min.css"` |
| `src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="..." crossorigin=""` | `src="vendor/leaflet.js"` |
| `href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="..." crossorigin=""` | `href="vendor/leaflet.css"` |

Aggiorna il meta tag CSP:
- Rimuove `https://unpkg.com` da `script-src`
- Rimuove `https://unpkg.com` da `style-src`

### 6. Assets — copia ricorsiva

Copia `assets/` in `dist/assets/` ricorsivamente, preservando la struttura.

### 7. Version — scrive metadata build

Scrive `dist/version.txt` con:
```
Build: <SHA-256 hash dei file in dist/>
Date:  <ISO 8601 timestamp>
```

L'hash e' calcolato concatenando il contenuto di tutti i file generati (CSS, JS, HTML) e facendo SHA-256 del risultato.

## Vendor Leaflet (`scripts/vendor-leaflet.js`)

Script separato per scaricare Leaflet da unpkg e salvarlo in `vendor/`:

1. Scarica `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
2. Scarica `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
3. Salva in `vendor/leaflet.js` e `vendor/leaflet.css`
4. La versione e' hardcoded nello script (aggiornamento intenzionale)

`vendor/` e' versionato in git (non in `.gitignore`). Il build non dipende dalla rete.

Comando: `npm run vendor`

## Package.json

```json
"scripts": {
  "start": "lite-server",
  "vendor": "node scripts/vendor-leaflet.js",
  "build": "node build.js"
}
```

DevDependency aggiunta: `terser`.

## .gitignore

Aggiunge `dist/` al `.gitignore` esistente.

## Verifica

1. `npm run vendor` scarica Leaflet in `vendor/`
2. `npm run build` produce `dist/` senza errori
3. `dist/index.html` servito con un server locale funziona identicamente al sito di sviluppo
4. `dist/css/style.min.css` e' un singolo file (nessun `@import`)
5. I file JS in `dist/js/` sono minificati ma mantengono gli `import` tra moduli
6. Leaflet funziona da `vendor/` locale (mappa visibile)
7. CSP in `dist/index.html` non include `unpkg.com`
8. Nessun errore/warning in console
9. `dist/version.txt` contiene hash e timestamp
