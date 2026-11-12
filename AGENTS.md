# Reguli Obligatorii pentru Proiectul YT2MP3 (GitHub Pages + Local MP3 Server)

Aceste reguli sunt active permanent și trebuie respectate la fiecare sesiune și la fiecare modificare în acest proiect:

## 1. De unde începi de fiecare dată (La începutul fiecărei sesiuni)
1. **Citește obligatoriu `regului.md` și `README.md`** înainte de a face modificări, pentru a prelua versiunea curentă PWA (`?v=N`), ultimul URL de tunel Cloudflare și starea ultimei intervenții.
2. **Verifică procesele de fundal (`manage_task` -> `list`):**
   - Asigură-te că `node server.js` rulează pe portul `3080` și că tunelul HTTPS `npx -y cloudflared tunnel --url http://localhost:3080` este activ.
   - Dacă s-au oprit (de exemplu, după repornirea sesiunii sau a Mac-ului), repornește-le imediat în fundal (`IsDaemon: true`) și, dacă URL-ul `.trycloudflare.com` s-a schimbat, actualizează `DEFAULT_TUNNEL_API` în `public/app.js`, sincronizează în rădăcină și publică pe GitHub Pages.

## 2. Reguli obligatorii la fiecare modificare de cod
1. **Editează în `public/` și sincronizează în rădăcină (`/`):**
   - După orice modificare în `public/index.html`, `public/styles.css`, `public/app.js`, `public/sw.js` sau `public/manifest.json`, incrementează versiunea de cache (`?v=N` și `CACHE_NAME = 'yt2mp3-pwa-vN'`) și copiază fișierele în rădăcina proiectului (`cp public/index.html public/styles.css public/app.js public/sw.js public/manifest.json .`).
2. **Actualizează obligatoriu `README.md` și `regului.md`:**
   - Nu încheia nicio modificare fără să actualizezi `README.md` (documentația + Changelog) și `regului.md` (ce s-a făcut ultima oară, data, versiunea curentă și de unde se continuă data viitoare).
3. **Publică pe GitHub (`git commit` + `git push origin main`):**
   - Include toate fișierele modificate (inclusiv `README.md` și `regului.md`) în commit și trimite-le pe `origin main`.
4. **Păstrează cerințele UI/UX ale utilizatorului:**
   - Răspunde întotdeauna în **limba română**.
   - Păstrează stilul **Neo-Skeuomorphism** (temele White Porcelain & Dark Obsidian Graphite), protecția **Safe Area (`env(safe-area-inset-top)`)** pentru iPhone Notch / Dynamic Island și nu reintroduce instrucțiunile de instalare.

