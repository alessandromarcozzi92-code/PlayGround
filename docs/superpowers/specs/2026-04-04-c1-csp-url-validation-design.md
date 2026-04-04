# C1 — URL Validation + Content Security Policy

## Contesto

Step C1 del piano PLAN-1.0.md. Il lavoro di B2 (sanitizzazione XSS) ha gia' creato `js/utils/sanitize.js` con `escapeHtml`, `escapeAttr`, `isValidMediaUrl`, `sanitizeMediaUrl` e li ha applicati in tutti i template pubblici e nell'import JSON admin. C1 completa la sicurezza aggiungendo CSP e coprendo i punti residui.

## Scope

2 interventi su 2 file esistenti, nessun file nuovo.

### 1. CSP meta tag in `index.html`

Aggiungere in `<head>`, prima dei `<link rel="preconnect">` (riga 22), il meta tag:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' https: data:; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self';">
```

Direttive e motivazioni:

- `default-src 'self'` — tutto cio' che non ha una direttiva specifica e' limitato all'origine
- `img-src 'self' https: data:` — immagini esterne (https), favicon SVG inline (data:), data:image/*
- `script-src 'self' https://unpkg.com` — JS locale + CDN Leaflet
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — CSS locale, stili inline (Leaflet + background-image nei template JS), Google Fonts
- `font-src https://fonts.gstatic.com` — file font di Google Fonts
- `connect-src 'self'` — nessun fetch/XHR verso domini terzi

### 2. Sanitizzazione URL lightbox in `gallery.js`

Alla riga 270, l'assegnamento diretto `image.src = photo.src` non passa per la validazione URL. I dati provengono da localStorage (inseriti tramite admin o import JSON) e potrebbero contenere URL malformati o pericolosi.

Correzione: `image.src = sanitizeMediaUrl(photo.src)`. Il modulo `sanitizeMediaUrl` e' gia' importato in `gallery.js`.

## Cosa NON cambia

- `js/utils/sanitize.js` — completo da B2, nessuna modifica necessaria
- Validazione import JSON in `dashboard.js` — gia' presente con `isValidMediaUrl`
- SRI su Leaflet CSS/JS — gia' presente in `index.html`
- Google Fonts — nessun SRI (il CSS generato da Google varia per User-Agent, rompendo l'hash; il CSP limita gia' il dominio a `fonts.googleapis.com` e `fonts.gstatic.com`)

## Verifica

1. Aprire il sito con DevTools Console: nessun errore/warning CSP per le risorse normali (CSS, JS, font, immagini)
2. Verificare che Leaflet (mappa), Google Fonts (tipografia), e immagini esterne funzionino senza blocchi
3. Iniettare `javascript:alert(1)` come URL immagine nell'admin: rifiutato da `sanitizeMediaUrl`
4. Lightbox: aprire una foto, verificare caricamento corretto con sanitizzazione
5. DevTools > Network: nessuna richiesta bloccata dalla CSP durante navigazione normale

## Note future

Quando verra' implementato il deploy (step D3), valutare di spostare la CSP da meta tag a HTTP header per supportare direttive aggiuntive (`frame-ancestors`, `report-uri`).
