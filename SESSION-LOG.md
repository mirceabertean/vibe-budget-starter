# Session Log

## [2026-04-14] — Resetare și schimbare parolă

### Ce s-a făcut
- **`/forgot-password`** — formular cu email; apelează `supabase.auth.resetPasswordForEmail()` cu `redirectTo: window.location.origin + /reset-password`; afișează mesaj succes cu opțiune "încearcă din nou"
- **`/reset-password`** — formular parolă nouă + confirmare; ascultă evenimentul `PASSWORD_RECOVERY` de la Supabase pentru a activa formularul; apelează `supabase.auth.updateUser({ password })`; redirect la `/login?reset=success` după succes
- **`/dashboard/settings`** — pagină "Setări cont" cu formular schimbare parolă pentru utilizatori logați; afișează eroarea exactă Supabase (util pentru debugging)
- **Login page** — link "Am uitat parola" adăugat lângă label-ul Parolă; mesaj verde de confirmare la `?reset=success`
- **Sidebar** — adăugat link "Setări cont ⚙️"
- **Deploy** — commit + push; Vercel a deploy-at automat

### Ce rămâne
- [ ] Configurare Supabase Dashboard: adăugat `https://vibe-budget-starter-inky.vercel.app/reset-password` la Redirect URLs (Authentication → URL Configuration) — necesar pentru resetare parolă în producție
- [ ] Auto-categorizare bazată pe keyword-uri salvate de utilizator (UI pentru salvare keywords)
- [ ] Fix dată format MM/DD vs DD/MM la import Excel (Raiffeisen)
- [ ] Export date (CSV/Excel)
- [ ] Navigation bar sticky pe mobile

### Commits
- `7efefef` Add forgot password and change password features

### Decizii importante
- `/reset-password` așteaptă evenimentul `PASSWORD_RECOVERY` (nu URL hash manual) — Supabase browser client îl emite automat când detectează token-ul din hash
- Eroarea Supabase afișată direct în `/dashboard/settings` (nu mesaj generic) — mai util pentru debugging
- `supabase.auth.updateUser({ password })` funcționează direct fără verificarea parolei vechi — utilizatorul e deja autentificat

---

## [2026-04-09] — Rapoarte, AI Financial Coach, Deploy Vercel

### Ce s-a făcut
- **Pagina Tranzacții** — adăugat filtru "Fără categorie" (`category_id = null`) și bulk edit cu checkbox (selectare multiplă + action bar pentru categorie/bancă)
- **API `PATCH /api/transactions/bulk-update`** — actualizare în masă cu Supabase `.in("id", ids)`
- **Pagina Rapoarte** (`/dashboard/reports`):
  - Pie chart cheltuieli pe categorii cu culorile categoriei (Recharts `PieChart`)
  - Bar chart cheltuieli pe luni (Recharts `BarChart` + `ResponsiveContainer`)
  - 3 carduri sumar: total cheltuieli (roșu), total venituri (verde), balanță (verde/roșu)
  - Filtre perioadă: luna curentă / ultimele 3 luni / ultimele 6 luni / tot
  - Stare goală dacă nu există date în perioadă
- **API `GET /api/dashboard/reports`** — agregare server-side: cheltuieli pe categorie + pe luni + totaluri
- **AI Financial Coach** (`POST /api/ai/financial-coach`):
  - Folosește `claude-haiku-4-5-20251001` pentru viteză + cost mic
  - Returnează health score 0-100 + explicație + observație pozitivă + 3-5 sfaturi
  - Buton "✨ Analizează cheltuielile" + "Reanalizează" după afișare
  - Fix JSON parse: `rawText.match(/\{[\s\S]*\}/)` pentru a extrage JSON din orice poziție
- **Dashboard** — navigare rapidă completă: adăugate carduri Tranzacții, Upload, Rapoarte
- **Deploy Vercel**:
  - Creat repo GitHub `mirceabertean/vibe-budget-starter`
  - 4 fix-uri TypeScript pentru compatibilitate Recharts v3 (index signature, `percent` vs `percentage`, `unknown` cast)
  - Setate 5 variabile de mediu pe Vercel via CLI
  - App live: https://vibe-budget-starter-inky.vercel.app

### Ce rămâne
- [ ] Fix dată format MM/DD vs DD/MM la import Excel (Raiffeisen) — codul e pregătit, Edit a fost întrerupt anterior
- [ ] UI pentru salvare keywords auto-categorizare
- [ ] Export date CSV/Excel
- [ ] Navigation bar sticky pe mobile
- [ ] Domeniu custom pe Vercel

### Commits
- `dce907e` Add reports, AI financial coach, and prepare for deploy
- `2e8d541` Fix TypeScript error in reports route for Vercel build
- `54b6f67` Fix Recharts TypeScript types for Vercel build
- `782b9d7` Fix Pie label TypeScript type for Vercel build
- `f0d055e` Fix Pie label using percent prop from Recharts v3

### Decizii importante
- `claude-haiku-4-5-20251001` ales față de Sonnet pentru latență mică (analiză financiară e simplă)
- JSON extras cu regex `\{[\s\S]*\}` — mai robust decât strip markdown
- Recharts v3 cere `[key: string]: unknown` index signature pe datele din `<Pie data={}>`
- Recharts `<Pie label>` primește `percent` (0-1), nu `percentage` — convertit la `(percent * 100).toFixed(1)%`
- Variabilele Supabase și Anthropic setate pe Vercel cu `vercel env add` via CLI

---

## [2026-04-08] — Upload CSV/Excel + Import Tranzacții

### Ce s-a făcut
- Instalat librăriile `papaparse`, `xlsx`, `@types/papaparse`
- Creat `lib/auto-categorization/index.ts` — funcție `autoCategorizaTransactie()` cu match case-insensitive pe keyword-uri utilizator
- Creat `app/api/transactions/import/route.ts` — `POST /api/transactions/import` cu bulk insert și auto-categorizare
- Actualizat pagina Upload (`app/dashboard/upload/page.tsx`):
  - Parsare automată la selectarea fișierului (CSV + Excel)
  - Loading spinner în timp ce procesează
  - Preview cu toate tranzacțiile detectate
  - Buton "Importă X tranzacții" dezactivat fără bancă selectată
  - Loading pe buton în timp ce importă
  - Mesaj succes: "X importate, Y categorizate automat"
  - Butoane "Încarcă alt fișier" și "Vezi tranzacțiile"
- Fixuri majore în `lib/utils/file-parser.ts`:
  - Detectare automată header row (suport fișiere cu metadata în primele rânduri — format Raiffeisen)
  - Prioritizare `descrierea` față de `beneficiar` în `detectDescription`
  - Skip coloane "Suma debit/credit" în detecția generală, tratate separat ca split debit/credit
  - `parseAmount()` helper: suport format românesc cu virgulă (`45,50` → `45.5`)
  - Fix debit cu valori negative în Excel (`-45.5 > 0` era false → acum `!= 0`)
  - Fix verificare zero: `parseAmount()` în loc de `!== "0"` (prinde și `"0,00"`)

### Ce rămâne
- [ ] Testat import end-to-end cu banca selectată
- [ ] Auto-categorizare bazată pe keyword-uri utilizator (UI pentru salvare keywords)
- [ ] Rapoarte și grafice
- [ ] Integrare Claude AI
- [ ] Export date

### Commits
- în așteptare (sesiunea curentă)

### Decizii importante
- Endpoint separat `/api/transactions/import` (nu modificat POST-ul existent pentru tranzacție singulară)
- `detectAmount` folosește `parseAmount()` pentru verificarea zero, nu comparație string
- Debit din Excel poate fi stocat negativ sau pozitiv — normalizăm la negativ în orice caz
- Header row detectat prin scor de keyword-uri (primele 30 rânduri, max matches câștigă)

---

## [2026-04-02] — Auth, Dashboard și pagini CRUD complete

### Ce s-a făcut
- Auth complet: login, register cu Supabase, redirect automat după autentificare
- Dashboard cu stats financiare (luna curentă + total general) și carduri de navigare rapidă
- Pagina **Bănci** — tabel + modal CRUD cu color picker (10 culori)
- Pagina **Categorii** — două tabele (Cheltuieli / Venituri) + modal cu icon picker (40 icoane) + color picker
- Pagina **Valute** — preseturi RON/EUR/USD/GBP + adăugare manuală + ștergere
- Pagina **Tranzacții** — tabel cu filtre (bancă, categorie, dată, search) + modal adaugă/editează/șterge; sumă negativă = cheltuială
- Pagina **Upload** — UI placeholder cu mesaj "Săptămâna 5, Lecția 5.1"; buton activ cu toast informativ
- Sidebar actualizat cu toate cele 6 linkuri de navigare
- API routes complete pentru toate resursele (GET, POST, PUT, DELETE)

### Ce rămâne
- [ ] Logica de procesare CSV/Excel (Săptămâna 5, Lecția 5.1)
- [ ] Auto-categorizare tranzacții
- [ ] Rapoarte și grafice
- [ ] Integrare Claude AI

### Commits
- `c3facfd` feat: auth, dashboard și pagini CRUD complete

### Decizii importante
- Culorile dinamice se aplică cu inline `style={{ color }}`, nu cu clase Tailwind (globals.css override cu !important)
- `supabaseAdmin` (service_role key) pentru toate query-urile server-side
- `createId()` din `@paralleldrive/cuid2` apelat manual la fiecare insert
- Suma tranzacție: negativă = cheltuială, pozitivă = venit (fără câmp `type` separat)
- Interfețele TypeScript folosesc snake_case pentru câmpurile din Supabase
