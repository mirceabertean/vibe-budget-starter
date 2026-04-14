# Vibe Budget — ROADMAP

## ✅ Săptămâna 1-2 — Fundație (DONE)

- [x] Setup proiect Next.js + Supabase
- [x] Schema DB (users, banks, currencies, categories, transactions, user_keywords)
- [x] Auth: login, register, logout
- [x] Dashboard cu stats (luna curentă + total general) + navigare rapidă
- [x] Pagina Bănci — CRUD complet
- [x] Pagina Categorii — două tabele venituri/cheltuieli, CRUD
- [x] Pagina Valute — preseturi + adăugare manuală
- [x] Pagina Tranzacții — tabel cu filtre + modal adaugă/editează/șterge
- [x] Pagina Upload — UI placeholder (fără logică)
- [x] Sidebar cu navigare completă

## ✅ Săptămâna 5, Lecția 5.1 — Upload CSV/Excel (DONE)

- [x] Instalare librării: papaparse, xlsx, @types/papaparse
- [x] Parsare fișiere CSV (`lib/utils/file-parser.ts` — parseCSV)
- [x] Parsare fișiere Excel (`lib/utils/file-parser.ts` — parseExcel)
  - [x] Detectare automată header row (suport metadata rows la început)
  - [x] Suport format Raiffeisen (Suma debit / Suma credit)
  - [x] Suport debit/credit split cu valori negative în Excel
  - [x] Conversie format românesc virgulă → punct (parseAmount)
- [x] Auto-categorizare tranzacții (`lib/auto-categorization/index.ts`)
- [x] API endpoint `POST /api/transactions/import` (bulk insert + auto-categorization)
- [x] Pagina Upload funcțională:
  - [x] Loading indicator la parsare
  - [x] Preview toate tranzacțiile (dată, descriere, sumă colorată, valută)
  - [x] Mesaj eroare la parsare eșuată
  - [x] Buton "Importă X tranzacții" (dezactivat fără bancă)
  - [x] Loading la import, mesaj succes cu statistici
  - [x] Butoane "Încarcă alt fișier" și "Vezi tranzacțiile"

## ✅ Sesiunea 2026-04-09 — Rapoarte, AI Coach, Deploy (DONE)

- [x] Pagina Tranzacții: filtru "Fără categorie" (`__none__`)
- [x] Bulk edit tranzacții cu checkbox + action bar (categorie + bancă)
- [x] API `PATCH /api/transactions/bulk-update`
- [x] Pagina Rapoarte (`/dashboard/reports`):
  - [x] Pie chart cheltuieli pe categorii (Recharts)
  - [x] Bar chart cheltuieli pe luni (Recharts)
  - [x] 3 carduri sumar: cheltuieli / venituri / balanță
  - [x] Filtre perioadă: luna curentă / 3 luni / 6 luni / tot
- [x] AI Financial Coach (`POST /api/ai/financial-coach`):
  - [x] Health score 0-100 cu bară progres colorată
  - [x] Observație pozitivă + 3-5 sfaturi personalizate
  - [x] Buton "Analizează cheltuielile" + "Reanalizează"
- [x] Dashboard: navigare rapidă completă (toate 6 secțiuni)
- [x] Deploy pe Vercel: https://vibe-budget-starter-inky.vercel.app
- [x] Variabile de mediu setate pe Vercel (Supabase + Anthropic)

## ✅ Sesiunea 2026-04-14 — Resetare și schimbare parolă (DONE)

- [x] Pagina `/forgot-password` — email → Supabase trimite link de resetare
- [x] Pagina `/reset-password` — setare parolă nouă din link email
- [x] Pagina `/dashboard/settings` — schimbare parolă pentru utilizatori logați
- [x] Login page — link "Am uitat parola" lângă câmpul Parolă
- [x] Deploy pe Vercel

## 🔜 Viitor

- [ ] Configurare Supabase: adăugat URL redirect pentru reset parolă în producție
- [ ] Auto-categorizare bazată pe keyword-uri salvate de utilizator (UI pentru salvare keywords)
- [ ] Fix dată format MM/DD vs DD/MM la import Excel (Raiffeisen)
- [ ] Export date (CSV/Excel)
- [ ] Navigation bar sticky pe mobile
- [ ] Domeniu custom pe Vercel
