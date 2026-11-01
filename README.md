# YT2MP3 — Aplicație PWA pentru iOS (iPhone) & Android pe GitHub Pages

Aplicație **Progressive Web App (PWA)** pregătită pentru **GitHub Pages** (`https://numele-tau.github.io/yt2mp3/`), care nu expiră niciodată pe iPhone (fără limita de 7 zile din Xcode) și se instalează direct pe ecranul principal din Safari.

---

## 🚀 Cum o publici pe GitHub Pages (100% Gratuit pe viață)

Toate fișierele statice necesare pentru GitHub Pages sunt pregătite direct în rădăcina proiectului ([`index.html`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/index.html), [`app.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/app.js), [`styles.css`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/styles.css), [`manifest.json`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/manifest.json), [`sw.js`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/sw.js), [`icon.svg`](file:///Users/florindorobantu/Desktop/Aplicatie-transformare-video%20in%20MP3/icon.svg) și `.nojekyll`):

1. Creează un repository nou (**Public**) pe GitHub (de exemplu numit `yt2mp3`).
2. Urcă fișierele din acest folder pe GitHub (prin GitHub Desktop, din interfața web *Upload files* sau din terminal):
   ```bash
   git init
   git add index.html styles.css app.js manifest.json sw.js icon.svg .nojekyll README.md
   git commit -m "YT2MP3 PWA pentru GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/scaevola1981/aplicatie-extragere-sunet-din-video.git
   git push -u origin main
   ```
3. Pe GitHub, intră în **Settings** $\rightarrow$ **Pages** (în meniul din stânga).
4. La **Build and deployment** $\rightarrow$ **Branch**, selectează **`main`** și folderul **`/ (root)`**, apoi apasă **Save**.
5. În ~30 de secunde, aplicația ta este live la:
   `https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/`

---

## 📱 Cum o instalează clientul pe iPhone
1. Deschide link-ul `https://scaevola1981.github.io/aplicatie-extragere-sunet-din-video/` în **Safari** pe iPhone.
2. Apasă butonul **Share (Distribuie)** $\rightarrow$ **„Adaugă la ecranul principal” (*Add to Home Screen*)**.
3. Aplicația **YT2MP3** apare pe ecranul iPhone-ului ca o aplicație nativă permanentă:
   - Caută videoclipuri pe YouTube direct din browser (prin API-uri publice CORS).
   - Descarcă MP3-ul direct pe iPhone.
   - Permite importarea și ascultarea melodiilor MP3 **100% Offline** (stocate în baza de date locală `IndexedDB` a telefonului).
