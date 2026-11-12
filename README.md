# 🎵 YT2MP3 — Aplicație PWA pentru iOS (iPhone), Android & Desktop

Aplicație **Progressive Web App (PWA)** pentru căutarea videoclipurilor pe YouTube și extragerea rapidă a sunetului în format **MP3** (`256 kbps`, `192 kbps`, `128 kbps`), cu bibliotecă audio **100% Offline** (`IndexedDB`) și interfață **Neo-Skeuomorphism** (temă **White Porcelain** & **Dark Obsidian Graphite**).

- 🌐 **URL Live (GitHub Pages):** [https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/?v=9](https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/?v=9)
- 📦 **Repository GitHub:** [https://github.com/scaevola1981/aplicatie-extragere-sunet-din-video](https://github.com/scaevola1981/aplicatie-extragere-sunet-din-video)
- 📋 **Reguli & Jurnal Sesiuni Agent:** [`regului.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/regului.md) & [`AGENTS.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/AGENTS.md)

---

## ✨ Funcționalități Principale

1. **Căutare YouTube & Preluare Link Direct:**
   - Caută melodii sau videoclipuri direct din aplicație (prin backend-ul `server.js` sau prin API-urile publice Piped CORS ca fallback).
   - Lipește direct orice link YouTube (`youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`) cu opțiune de pornire automată a descărcării MP3.
2. **Extragere și Conversie MP3 Reală (`yt-dlp` + `FFmpeg`):**
   - Selectare calitate audio: **Max (~256 kbps)**, **192 kbps** sau **128 kbps**.
   - Afișare progres în timp real (`0% -> 100%`) în timpul descărcării și conversiei.
3. **Bibliotecă MP3 100% Offline pe Telefon (`IndexedDB`):**
   - Fiecare melodie descărcată este salvată automat și în baza de date locală a browserului (`IndexedDB`), putând fi ascultată offline oricând fără conexiune la internet.
   - Permite și **importul de fișiere MP3 locale** din telefon/calculator (`➕ Importă MP3`).
   - Pe iPhone/iOS oferă buton dedicat de partajare nativă (`navigator.share`) pentru salvarea directă în aplicația **Fișiere (Files)** sau trimiterea pe **WhatsApp**.
4. **Design Neo-Skeuomorphism Dual-Theme & Safe Area pentru iPhone:**
   - Temă dublă **☀️ White (Porcelain)** și **🌙 Dark (Obsidian Graphite)** cu comutare instantanee și sincronizare cu preferința sistemului de operare (`prefers-color-scheme`).
   - Protecție **Safe Area (`env(safe-area-inset-top)`)** în partea superioară pentru a nu intra sub **Notch / Dynamic Island** pe iPhone (atât în Safari, cât și ca aplicație instalată pe ecranul principal).

---

## 🏗️ Arhitectură & Cum Funcționează (GitHub Pages + Backend MP3)

Deoarece **GitHub Pages** găzduiește doar fișiere statice (`HTML`, `CSS`, `JS`), aplicația folosește o arhitectură hibridă inteligentă în [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js):

1. **Interfața PWA (Frontend):**
   - Este servită de pe GitHub Pages (`https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/`) sau direct local de pe `http://localhost:3080`.
2. **Motorul de Extragere MP3 (Backend — [`server.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/server.js)):**
   - Rulează Node.js pe portul **`3080`** și folosește `yt-dlp` + `FFmpeg` pentru a extrage fluxul audio și a-l converti în `.mp3`.
   - Include headerele CORS complete (`Access-Control-Allow-Origin: *` și `Access-Control-Allow-Private-Network: true`).
3. **Conectare Automată Multi-Endpoint (`fetchFromBackend` în [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js)):**
   - Când este deschisă de pe GitHub Pages, aplicația încearcă automat în ordine:
     1. Un URL personalizat salvat prin parametrul `?api=https://...` (dacă a fost specificat).
     2. Tunelul HTTPS Cloudflare activ (`DEFAULT_TUNNEL_API` — în prezent `https://burst-neo-trinity-truly.trycloudflare.com`), care permite descărcarea MP3 de pe iPhone/Android de oriunde.
     3. `http://localhost:3080` și `http://127.0.0.1:3080` — fallback automat direct pe Mac, chiar dacă tunelul Cloudflare temporar s-a oprit sau și-a schimbat adresa.

---

## 🛠️ Pornire Rapidă pe Mac (Server Local + Tunel HTTPS)

Dacă Mac-ul a fost repornit, pornește serverul local și tunelul Cloudflare cu următoarele comenzi:

```bash
# 1. Pornește serverul local de extragere MP3 (pe portul 3080)
node server.js

# 2. (Opțional, pentru acces de pe iPhone/Android prin GitHub Pages HTTPS)
# Pornește tunelul HTTPS Cloudflare către portul 3080:
npx -y cloudflared tunnel --url http://localhost:3080
```

> **Sfat:** Dacă `cloudflared` generează un URL nou de forma `https://nume-nou.trycloudflare.com`, îl poți folosi imediat pe telefon accesând:
> `https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/?api=https://nume-nou.trycloudflare.com`

---

## 📂 Structura Proiectului

Fișierele din [`public/`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public) sunt oglindite în rădăcina proiectului (`/`) pentru ca GitHub Pages să le poată servi direct din branch-ul `main`:

- [`public/index.html`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/index.html) & [`index.html`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/index.html) — Structura HTML5 a aplicației PWA și inițializarea temei fără FOUC.
- [`public/styles.css`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/styles.css) & [`styles.css`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/styles.css) — Sistemul de design **Neo-Skeuomorphism** (White & Dark), variabilele CSS, protecția Safe Area (`env(safe-area-inset-*)`) și stilurile responsive.
- [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js) & [`app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/app.js) — Logica client-side: comutatorul de temă White/Dark, căutarea YouTube, conectarea multi-endpoint la backend (`fetchFromBackend`), polling-ul pentru progresul MP3 și stocarea offline în `IndexedDB`.
- [`public/sw.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/sw.js) & [`sw.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/sw.js) — Service Worker pentru funcționarea PWA și gestionarea cache-ului (`yt2mp3-pwa-v9`).
- [`public/manifest.json`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/manifest.json) & [`manifest.json`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/manifest.json) — Configurația Web App Manifest pentru instalarea pe iOS și Android.
- [`server.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/server.js) — Serverul Node.js (port `3080`) care orchestrează `yt-dlp` și `FFmpeg` pentru extragerea MP3.
- [`regului.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/regului.md) — Reguli obligatorii de lucru și jurnalul la zi pentru agentul AI.
- [`AGENTS.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/AGENTS.md) — Regulă de sistem Antigravity (`always_on`) creată prin `/learn` care încarcă automat instrucțiunile de continuitate la fiecare sesiune.

---

## 📝 Istoric Versiuni (Changelog)

- **`v9` (12 Noiembrie 2026):**
  - Repornit `server.js` (port `3080`) și tunelul Cloudflare HTTPS (`https://burst-neo-trinity-truly.trycloudflare.com`) după repornirea sistemului.
  - Adăugat `fetchFromBackend()` în [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js) cu fallback automat pe `http://localhost:3080` și curățarea automată a tunelurilor Cloudflare expirate din `localStorage`.
  - Adăugat header-ul `Access-Control-Allow-Private-Network: true` în [`server.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/server.js) pentru acces direct din Chrome de pe GitHub Pages către `localhost:3080`.
  - Creat [`regului.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/regului.md) și actualizat documentația completă în [`README.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/README.md).
- **`v8` (1 Noiembrie 2026):**
  - Eliminat butonul și secțiunea cu instrucțiuni de instalare din interfață.
  - Adăugat **Safe Area Padding** în partea de sus a ecranului (`padding-top: max(calc(env(safe-area-inset-top, 0px) + 18px), 58px)`) pentru a nu intra sub Notch / Dynamic Island pe iPhone.
- **`v7` (1 Noiembrie 2026):**
  - Repararea comutatorului **☀️ White / 🌙 Dark** prin sincronizarea atributului `data-theme` pe `<html>` împreună cu `<meta name="color-scheme">`.
- **`v5` – `v6` (1 Noiembrie 2026):**
  - Implementare completă **Neo-Skeuomorphism** în variantele **White Porcelain** și **Dark Obsidian Graphite** conform ghidurilor `modern-web-guidance`.
- **`v1` – `v4` (1 Noiembrie 2026):**
  - Lansarea aplicației PWA pe GitHub Pages, integrarea căutării YouTube, a bibliotecii offline `IndexedDB` și a conversiei MP3 prin `server.js` + Cloudflare HTTPS Tunnel.
