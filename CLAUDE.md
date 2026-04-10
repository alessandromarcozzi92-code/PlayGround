# Surprise — Travel Photography

## Workflow di sviluppo

### Branching strategy

Il repository ha due branch protetti:
- **`main`** — branch live, riflette esattamente il sito in produzione su GitHub Pages. Ogni push su `main` triggera il deploy automatico. Nessun commit diretto: si aggiorna solo via PR da `development`.
- **`development`** — branch di integrazione. Tutti i nuovi sviluppi partono da qui e vengono rimergiati qui tramite PR. Quando `development` è stabile, si apre una PR `development` -> `main` per promuovere le modifiche in produzione.

### Creazione di un nuovo branch di feature

Quando si sviluppa uno step del piano (PLAN-1.0.md), creare SEMPRE un nuovo branch a partire da `development`:

1. Assicurarsi di essere su `development` aggiornato:
   ```
   git checkout development && git pull origin development
   ```
2. Creare il nuovo branch:
   ```
   git checkout -b XX_breve-descrizione
   ```
- **Formato nome branch:** `XX_breve-descrizione` (numerazione incrementale a 2 cifre)
- **Esempi:** `08_rate-limiting`, `09_hero-slideshow`, `10_lightbox-zoom`
- NON fare merge automaticamente — aspettare richiesta esplicita dell'utente
- I feature branch si mergiano su `development`, mai direttamente su `main`

### Promozione a produzione

Quando `development` contiene una o piu' feature pronte e validate, aprire una PR da `development` verso `main`. Il merge su `main` triggera automaticamente il workflow di deploy su GitHub Pages.
