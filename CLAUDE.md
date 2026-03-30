# Surprise — Travel Photography

## Workflow di sviluppo

### Branching strategy
Quando si sviluppa uno step del piano (PLAN-1.0.md), creare SEMPRE un nuovo branch prima di iniziare:
- **Formato nome branch:** `XX_breve-descrizione` (numerazione incrementale a 2 cifre)
- **Esempi:** `01_css-splitting`, `02_admin-splitting`, `03_xss-sanitization`
- Creare il branch dal branch corrente (`git checkout -b XX_descrizione`)
- NON fare merge automaticamente — aspettare richiesta esplicita dell'utente
