# 📌 Reguli de Lucru și Jurnal de Stare pentru Agent (`regului.md`)

Acest fișier trebuie **citit la începutul fiecărei sesiuni** și **actualizat obligatoriu după fiecare modificare** efectuată în proiect, împreună cu [`README.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/README.md).

---

## 🧭 1. De unde începi de fiecare dată (Checklist la startul sesiunii)

De fiecare dată când utilizatorul îți trimite o cerere nouă în acest proiect:

1. **Citește [`regului.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/regului.md) și [`README.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/README.md)** pentru a ști exact:
   - Care este **versiunea curentă de cache PWA** (în prezent: **`v10`**).
   - Care este **ultimul URL de tunel Cloudflare HTTPS** configurat în `DEFAULT_TUNNEL_API` din [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js).
   - Ce s-a lucrat la ultima intervenție.
2. **Verifică procesele de fundal (`manage_task` cu `Action: "list"`):**
   - Verifică dacă **`node server.js`** rulează pe portul `3080`.
   - Verifică dacă **`npx -y cloudflared tunnel --url http://localhost:3080`** rulează și este activ.
   - **Important:** Dacă sesiunea sau Mac-ul au fost repornite și task-urile de fundal sunt oprite:
     1. Pornește `node server.js` ca daemon (`IsDaemon: true`, `BypassSandbox: true` deoarece `yt-dlp` are nevoie de acces la internet).
     2. Pornește `npx -y cloudflared tunnel --url http://localhost:3080` ca daemon (`IsDaemon: true`, `BypassSandbox: true`).
     3. Citește noul URL `https://....trycloudflare.com` din log-ul task-ului și actualizează constanta `DEFAULT_TUNNEL_API` în [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js).

---

## ⚙️ 2. Reguli Obligatorii la Fiecare Modificare

Ori de câte ori modifici codul aplicației (HTML, CSS, JS sau backend):

1. **Editează mai întâi sursa din folderul `public/`:**
   - Fișierele principale sunt în [`public/index.html`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/index.html), [`public/styles.css`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/styles.css), [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js), [`public/sw.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/sw.js), [`public/manifest.json`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/manifest.json).
2. **Incrementează versiunea de cache PWA (`?v=N`):**
   - La fiecare schimbare de frontend, crește numărul versiunii (`v9` $\rightarrow$ `v10` etc.) în:
     - [`public/index.html`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/index.html) (`manifest.json?v=N`, `styles.css?v=N`, `app.js?v=N`)
     - [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js) (`navigator.serviceWorker.register('./sw.js?v=N')`)
     - [`public/sw.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/sw.js) (`const CACHE_NAME = 'yt2mp3-pwa-vN'`)
3. **Sincronizează obligatoriu `public/` cu rădăcina proiectului (`/`):**
   - GitHub Pages servește fișierele direct din rădăcina `/` a branch-ului `main`. Rulează de fiecare dată:
     ```bash
     cp public/index.html public/styles.css public/app.js public/sw.js public/manifest.json .
     ```
4. **Actualizează obligatoriu [`README.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/README.md) și [`regului.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/regului.md):**
   - Nu încheia niciodată o modificare fără să actualizezi secțiunea **Changelog** din [`README.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/README.md) și secțiunea **Ultima Intervenție & Starea Curentă** din [`regului.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/regului.md).
5. **Publică pe GitHub Pages (`git commit` + `git push origin main`):**
   - Fă commit tuturor fișierelor modificate (inclusiv `README.md` și `regului.md`) și trimite-le pe `origin main`.
6. **Respectă stilul și cerințele proiectului:**
   - Răspunde întotdeauna în **limba română**.
   - Păstrează stilizarea **Neo-Skeuomorphism** (temele **White Porcelain** & **Dark Obsidian Graphite**) și respectă regulile din skill-ul `modern-web-guidance` (inclusiv secțiunea `### Modern Web Guidance` la finalul răspunsurilor care modifică HTML/CSS/JS).
   - Păstrează protecția **Safe Area (`env(safe-area-inset-top)`)** în partea de sus a ecranului pentru iPhone Notch / Dynamic Island și **nu** reintroduce instrucțiunile de instalare eliminate în `v8`.

---

## 📊 3. Starea Tehnică la Zi & Ultima Intervenție

- **Data ultimei actualizări:** `12 Noiembrie 2026`
- **Versiunea PWA curentă:** `v10`
- **URL Live GitHub Pages:** `https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/?v=10`
- **Server Local (`server.js`):** Port `3080` (`http://localhost:3080`) — activ în fundal (Task ID: `task-389`).
- **Tunel Cloudflare HTTPS (`cloudflared`):** `https://burst-neo-trinity-truly.trycloudflare.com` — activ în fundal (Task ID: `task-366`).

### Ce am făcut ultima oară (12 Noiembrie 2026 — `v10`):
1. **Modal nativ de actualizări (`<dialog>` + butoane [Actualizează acum / Mai târziu]):**
   - Am adăugat elementul nativ `<dialog id="updateDialog" closedby="any">` în [index.html](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/index.html) și [app.js](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js) cu butoanele de acțiune:
     - **🚀 Actualizează acum:** descarcă noile actualizări prin Service Worker (`SKIP_WAITING`), șterge cache-ul vechi și reîncarcă instantaneu aplicația la noua versiune.
     - **⏳ Mai târziu:** închide fereastra și reține decizia temporar (`sessionStorage`) pentru a nu deranja utilizatorul în sesiunea curentă.
   - Am adăugat butonul dedicat `🔄 v10` în antet pentru a putea redeschide oricând detaliile noilor versiuni.
2. **Sistem de verificare a actualizărilor (`version.json`):**
   - Creat `public/version.json` și `version.json` pentru notificarea automată la încărcarea aplicației sau când tab-ul redevine vizibil (`visibilitychange`).
3. **Conformitate `modern-web-guidance`:**
   - Respectat ghidurile `dialog`, `light-dismiss-a-dialog` (cu suport nativ `closedby="any"` și fallback bazat pe coordonate pentru click în afara ferestrei) și `prevent-page-scroll-under-modal-dialog` (`overscroll-behavior: contain` pe dialog și `::backdrop`).
4. **Sincronizare și Cache Busting:**
   - Copiat toate fișierele din `public/` în rădăcina `/`, incrementat cache-ul la `yt2mp3-pwa-v10` și publicat pe `origin main`.

