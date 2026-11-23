# 📌 Reguli de Lucru și Jurnal de Stare pentru Agent (`regului.md`)

Acest fișier trebuie **citit la începutul fiecărei sesiuni** și **actualizat obligatoriu după fiecare modificare** efectuată în proiect, împreună cu [`README.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/README.md).

---

## 🧭 1. De unde începi de fiecare dată (Checklist la startul sesiunii)

De fiecare dată când utilizatorul îți trimite o cerere nouă în acest proiect:

1. **Citește [`regului.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/regului.md) și [`README.md`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/README.md)** pentru a ști exact:
   - Care este **versiunea curentă de cache PWA** (în prezent: **`v12`**).
   - Care este **URL-ul de backend Cloud Render.com** configurat în `DEFAULT_TUNNEL_API` din [`public/app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/public/app.js) (`https://aplicatie-extragere-sunet-din-video.onrender.com`).
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

- **Data ultimei actualizări:** `23 Noiembrie 2026`
- **Versiunea PWA curentă:** `v12`
- **URL Live GitHub Pages:** `https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/?v=12`
- **Server Cloud 24/7 (Render.com):** `https://aplicatie-extragere-sunet-din-video.onrender.com` (auto-deploy din `main` via `Dockerfile`).
- **Tailscale IP Mac:** `100.97.95.82` (`mac-mini-florin`).

### Ce am făcut ultima oară (23 Noiembrie 2026 — `v12`):
1. **Deploy pe Render.com (Cloud 24/7 independent de Mac):**
   - Serviciul `aplicatie-extragere-sunet-din-video` a fost publicat pe Render (Docker, Frankfurt EU Central, Free Plan) la `https://aplicatie-extragere-sunet-din-video.onrender.com`.
   - Am actualizat `DEFAULT_TUNNEL_API` din `public/app.js` către serverul Render.com.
2. **Protecție anti-bot YouTube pentru IP-uri de datacenter în [`server.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/server.js):**
   - Adăugat încercări automate cu `player_client=android_vr`, `tv`, `ios`, suport pentru variabile de mediu `YOUTUBE_COOKIES` / `YOUTUBE_COOKIES_BASE64`, și fallback automat prin Piped audio streams + `FFmpeg`.
3. **Sincronizare PWA v12 pe GitHub Pages + Render Auto-Deploy:**
   - Actualizat cache la `v12` în `index.html`, `app.js`, `sw.js`, `version.json`, copiat în rădăcină, actualizat `README.md` și `regului.md` și publicat pe `origin main`.

