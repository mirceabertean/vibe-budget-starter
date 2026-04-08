# Session Log

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
