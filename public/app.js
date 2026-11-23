(() => {
  'use strict';

  const searchForm = document.getElementById('searchForm');
  const queryInput = document.getElementById('queryInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const autoDownloadCheck = document.getElementById('autoDownloadCheck');
  const statusCard = document.getElementById('statusCard');
  const resultsSection = document.getElementById('resultsSection');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsList = document.getElementById('resultsList');
  const libraryList = document.getElementById('libraryList');
  const libraryCount = document.getElementById('libraryCount');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const openUpdateModalBtn = document.getElementById('openUpdateModalBtn');
  const updateDialog = document.getElementById('updateDialog');
  const updateVersionBadge = document.getElementById('updateVersionBadge');
  const updateDialogTitle = document.getElementById('updateDialogTitle');
  const updateDialogSubtitle = document.getElementById('updateDialogSubtitle');
  const updateNotesList = document.getElementById('updateNotesList');
  const updateStatusMsg = document.getElementById('updateStatusMsg');
  const importMp3Btn = document.getElementById('importMp3Btn');
  const importMp3Input = document.getElementById('importMp3Input');
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  const darkMql = window.matchMedia('(prefers-color-scheme: dark)');

  function getRenderedScheme() {
    let stored = null;
    try {
      stored = localStorage.getItem('color-scheme');
    } catch (_) {}
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return darkMql.matches ? 'dark' : 'light';
  }

  function updateThemeButtonLabel() {
    if (!themeToggleBtn) return;
    const current = getRenderedScheme();
    themeToggleBtn.textContent = current === 'dark' ? '☀️ White' : '🌙 Dark';
  }

  function applySchemeToDom(storedOrNull) {
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', storedOrNull ?? 'light dark');
    }
    if (storedOrNull === 'light' || storedOrNull === 'dark') {
      document.documentElement.dataset.theme = storedOrNull;
    } else {
      delete document.documentElement.dataset.theme;
    }
    updateThemeButtonLabel();
  }

  // Two-state color-scheme toggle conforming to dark-mode-toggle guide
  if (themeToggleBtn && colorSchemeMeta) {
    let initialStored = null;
    try {
      initialStored = localStorage.getItem('color-scheme');
    } catch (_) {}
    applySchemeToDom(initialStored);

    themeToggleBtn.addEventListener('click', () => {
      const currentRendered = getRenderedScheme();
      const target = currentRendered === 'dark' ? 'light' : 'dark';
      const systemScheme = darkMql.matches ? 'dark' : 'light';

      try {
        if (target !== systemScheme) {
          localStorage.setItem('color-scheme', target);
          applySchemeToDom(target);
        } else {
          localStorage.removeItem('color-scheme');
          applySchemeToDom(null);
        }
      } catch (_) {
        applySchemeToDom(target);
      }
    });

    darkMql.addEventListener('change', () => {
      updateThemeButtonLabel();
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'color-scheme') {
        applySchemeToDom(e.newValue);
      }
    });
  }

  // Backend API URL (Permanent Tailscale Funnel HTTPS + Localhost fallback sau ?api=https://...)
  const DEFAULT_TUNNEL_API = 'https://mac-mini-florin.tail1bff6a.ts.net';
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('api')) {
    const customApi = urlParams.get('api').replace(/\/+$/, '');
    localStorage.setItem('yt2mp3_api_base', customApi);
  }
  const isGitHubPages = window.location.hostname.endsWith('github.io');
  const storedApiBase = localStorage.getItem('yt2mp3_api_base') || '';
  if (storedApiBase.includes('trycloudflare.com') && storedApiBase !== DEFAULT_TUNNEL_API && !urlParams.has('api')) {
    localStorage.removeItem('yt2mp3_api_base');
  }
  let activeApiBase = null;

  function getApiCandidates() {
    if (!isGitHubPages) return [''];
    const custom = localStorage.getItem('yt2mp3_api_base') || '';
    const raw = [activeApiBase, custom, DEFAULT_TUNNEL_API, 'http://localhost:3080', 'http://127.0.0.1:3080'];
    const seen = new Set();
    const list = [];
    for (const item of raw) {
      if (typeof item === 'string' && item.length > 0 && !seen.has(item)) {
        seen.add(item);
        list.push(item);
      }
    }
    return list;
  }

  async function fetchFromBackend(pathAndQuery, options = {}) {
    const candidates = getApiCandidates();
    for (const base of candidates) {
      try {
        const res = await fetch(`${base}${pathAndQuery}`, options);
        if (res.ok) {
          activeApiBase = base;
          return { res, base };
        }
      } catch (_) {}
    }
    return null;
  }

  const PUBLIC_PIPED_APIS = [
    'https://api.piped.private.coffee',
    'https://pipedapi.ducks.party',
    'https://pipedapi.kavin.rocks'
  ];

  autoDownloadCheck.checked = localStorage.getItem('yt2mp3_auto_dl') === '1';
  autoDownloadCheck.addEventListener('change', () => {
    localStorage.setItem('yt2mp3_auto_dl', autoDownloadCheck.checked ? '1' : '0');
  });

  if (!CSS.supports('selector(:has(*))')) {
    const syncFallbackClasses = () => {
      document.querySelectorAll('.radio-label, .checkbox-label').forEach((lbl) => {
        const input = lbl.querySelector('input');
        if (input) {
          lbl.classList.toggle('is-checked', input.checked);
        }
      });
    };
    syncFallbackClasses();
    searchForm.addEventListener('change', syncFallbackClasses);
  }

  const CURRENT_APP_VERSION = 'v14';
  let latestVersionInfo = {
    version: CURRENT_APP_VERSION,
    date: '23 Noiembrie 2026',
    title: 'Actualizare Nouă — YT2MP3 v14 (Fix iOS)',
    subtitle: '23 Noiembrie 2026 • Salvare MP3 instantă pe iPhone & buton Actualizare reparat',
    notes: [
      '📱 Reparat blocajul „Se salvează fișierul MP3 pe telefon...” pe iPhone / Safari',
      '📥 Adăugat buton direct de descărcare MP3 + Salvare în Fișiere pe iOS',
      '🔄 Reparat butonul „Actualizează acum” pentru reîncărcare garantată pe iOS PWA',
      '🔒 Adresă HTTPS permanentă 24/7 (Tailscale Funnel + serviciu automat macOS)'
    ]
  };
  let swRegistration = null;

  // Fallback for <dialog closedby="any"> in browsers without native closedBy support
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) dialog.close();
      });
    }
  }

  function renderUpdateDialogContent(info) {
    if (!updateDialog) return;
    const ver = info.version || CURRENT_APP_VERSION;
    if (updateVersionBadge) updateVersionBadge.textContent = `Versiunea ${ver}`;
    if (updateDialogTitle) updateDialogTitle.textContent = info.title || `Actualizare Nouă — YT2MP3 ${ver}`;
    if (updateDialogSubtitle) {
      updateDialogSubtitle.textContent =
        info.subtitle || `${info.date || ''} • Cele mai noi îmbunătățiri sunt gata de instalare`;
    }
    if (updateNotesList && Array.isArray(info.notes) && info.notes.length > 0) {
      updateNotesList.innerHTML = '';
      for (const note of info.notes) {
        const li = document.createElement('li');
        li.textContent = note;
        updateNotesList.appendChild(li);
      }
    }
    const ackVer = localStorage.getItem('yt2mp3_ack_version');
    if (openUpdateModalBtn) {
      const hasUnapplied = ackVer !== ver;
      openUpdateModalBtn.textContent = hasUnapplied ? `🔄 ${ver} • Nou` : `🔄 ${ver}`;
      openUpdateModalBtn.classList.toggle('has-update', hasUnapplied);
    }
  }

  async function applyAppUpdateNow() {
    const targetVer = latestVersionInfo.version || CURRENT_APP_VERSION;
    try {
      localStorage.setItem('yt2mp3_ack_version', targetVer);
      sessionStorage.removeItem('yt2mp3_dismissed_version');
    } catch (_) {}

    showLoadingCard(`Se actualizează aplicația la ${targetVer}...`);

    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          try {
            if (reg.waiting) {
              reg.waiting.postMessage('SKIP_WAITING');
            }
            await reg.unregister();
          } catch (_) {}
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (_) {}

    const nextUrl = new URL(window.location.href);
    const verNum = String(targetVer).replace(/^v/i, '') || '14';
    nextUrl.searchParams.set('v', verNum);
    nextUrl.searchParams.set('r', String(Date.now()));
    window.location.href = nextUrl.toString();
  }

  async function checkForAppUpdates(forceOpen = false) {
    try {
      const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          latestVersionInfo = data;
        }
      }
    } catch (_) {}

    renderUpdateDialogContent(latestVersionInfo);
    if (!updateDialog) return;

    const targetVer = latestVersionInfo.version || CURRENT_APP_VERSION;
    let ackVer = null;
    let dismissedVer = null;
    try {
      ackVer = localStorage.getItem('yt2mp3_ack_version');
      dismissedVer = sessionStorage.getItem('yt2mp3_dismissed_version');
    } catch (_) {}

    const shouldPrompt = forceOpen || (ackVer !== targetVer && dismissedVer !== targetVer);
    if (shouldPrompt && !updateDialog.open) {
      if (updateStatusMsg) updateStatusMsg.classList.add('hidden');
      updateDialog.showModal();
    }
  }

  if (openUpdateModalBtn && updateDialog) {
    openUpdateModalBtn.addEventListener('click', () => {
      checkForAppUpdates(true);
    });

    updateDialog.addEventListener('close', () => {
      const choice = updateDialog.returnValue;
      updateDialog.returnValue = '';
      const targetVer = latestVersionInfo.version || CURRENT_APP_VERSION;

      if (choice === 'update-now') {
        applyAppUpdateNow();
      } else {
        try {
          sessionStorage.setItem('yt2mp3_dismissed_version', targetVer);
        } catch (_) {}
        renderUpdateDialogContent(latestVersionInfo);
      }
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js?v=14')
      .then((reg) => {
        swRegistration = reg;
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              checkForAppUpdates(true);
            }
          });
        });
      })
      .catch(() => {});
  }

  checkForAppUpdates(false);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdates(false);
    }
  });

  function getSelectedQuality() {
    const checked = document.querySelector('input[name="quality"]:checked');
    return checked ? checked.value : '0';
  }

  function extractVideoId(raw) {
    if (!raw) return null;
    const text = String(raw).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
    const urlMatch = text.match(/https?:\/\/[^\s"<>]+/i);
    const candidate = urlMatch ? urlMatch[0] : text;
    const idMatch = candidate.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/i);
    return idMatch ? idMatch[1] : null;
  }

  function formatDurationSeconds(sec) {
    const s = Number(sec) || 0;
    if (s <= 0) return 'Audio';
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const rem = Math.floor(s % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    }
    return `${mins}:${String(rem).padStart(2, '0')}`;
  }

  async function searchYoutubeVideos(query) {
    const backendHit = await fetchFromBackend(`/api/search?q=${encodeURIComponent(query)}`);
    if (backendHit) {
      try {
        const data = await backendHit.res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          return data.results;
        }
      } catch (_) {}
    }

    for (const base of PUBLIC_PIPED_APIS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(
          `${base}/search?q=${encodeURIComponent(query)}&filter=videos`,
          { signal: controller.signal }
        );
        clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const mapped = [];
        for (const item of items) {
          const vid = extractVideoId(item.url || '');
          if (!vid) continue;
          mapped.push({
            id: vid,
            title: item.title || 'Videoclip YouTube',
            uploader: item.uploaderName || 'YouTube',
            durationText: formatDurationSeconds(item.duration),
            thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
            webpageUrl: `https://www.youtube.com/watch?v=${vid}`
          });
          if (mapped.length >= 10) break;
        }
        if (mapped.length > 0) return mapped;
      } catch (_) {}
    }

    throw new Error('Serviciul de căutare nu a răspuns. Poți lipi direct link-ul din YouTube!');
  }

  async function fetchVideoMetadata(rawUrlOrId) {
    const videoId = extractVideoId(rawUrlOrId);
    if (!videoId) throw new Error('Link YouTube invalid.');
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const backendHit = await fetchFromBackend(`/api/info?url=${encodeURIComponent(watchUrl)}`);
    if (backendHit) {
      try {
        const data = await backendHit.res.json();
        if (data.video) return data.video;
      } catch (_) {}
    }

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          id: videoId,
          title: data.title || 'Videoclip YouTube',
          uploader: data.author_name || 'YouTube',
          durationText: 'YouTube Audio',
          thumbnailUrl: thumbUrl,
          webpageUrl: watchUrl
        };
      }
    } catch (_) {}

    return {
      id: videoId,
      title: `Videoclip YouTube (${videoId})`,
      uploader: 'YouTube',
      durationText: 'YouTube Audio',
      thumbnailUrl: thumbUrl,
      webpageUrl: watchUrl
    };
  }

  const DB_NAME = 'yt2mp3_library_db';
  const STORE_NAME = 'mp3_files';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveMp3ToLibrary({ fileName, blob }) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const item = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fileName,
        size: blob.size,
        createdAt: Date.now(),
        blob
      };
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAllMp3FromLibrary() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteMp3FromLibrary(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  importMp3Btn.addEventListener('click', () => {
    importMp3Input.click();
  });

  importMp3Input.addEventListener('change', async () => {
    const files = Array.from(importMp3Input.files || []);
    for (const file of files) {
      await saveMp3ToLibrary({ fileName: file.name, blob: file });
    }
    importMp3Input.value = '';
    await renderLibrary();
  });

  function triggerBrowserDownload(blob, fileName) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  }

  async function shareOrSaveOnIphone(blob, fileName) {
    const file = new File([blob], fileName, { type: 'audio/mpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName
        });
        return;
      } catch (_) {}
    }
    triggerBrowserDownload(blob, fileName);
  }

  async function renderLibrary() {
    try {
      const items = await getAllMp3FromLibrary();
      libraryCount.textContent = String(items.length);
      libraryList.innerHTML = '';

      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'card empty-state';
        empty.textContent = 'Nicio melodie MP3 salvată încă. Caută o melodie mai sus, lipește un link din YouTube sau importă un fișier MP3.';
        libraryList.appendChild(empty);
        return;
      }

      for (const item of items) {
        const card = document.createElement('div');
        card.className = 'library-item library-item-col';

        const topRow = document.createElement('div');
        topRow.className = 'library-top-row';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-info';

        const titleEl = document.createElement('p');
        titleEl.className = 'item-title';
        titleEl.textContent = item.fileName.replace(/\.mp3$/i, '');

        const sizeMb = (item.size / (1024 * 1024)).toFixed(1);
        const subEl = document.createElement('p');
        subEl.className = 'item-sub';
        subEl.textContent = `MP3 • ${sizeMb} MB`;

        infoDiv.appendChild(titleEl);
        infoDiv.appendChild(subEl);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'library-actions';

        const shareBtn = document.createElement('button');
        shareBtn.type = 'button';
        shareBtn.className = 'btn-icon';
        shareBtn.textContent = '📤 Fișiere / Share';
        shareBtn.addEventListener('click', () => {
          shareOrSaveOnIphone(item.blob, item.fileName);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-icon';
        delBtn.textContent = '🗑️';
        delBtn.addEventListener('click', async () => {
          await deleteMp3FromLibrary(item.id);
          renderLibrary();
        });

        actionsDiv.appendChild(shareBtn);
        actionsDiv.appendChild(delBtn);

        topRow.appendChild(infoDiv);
        topRow.appendChild(actionsDiv);

        const audioEl = document.createElement('audio');
        audioEl.controls = true;
        audioEl.preload = 'metadata';
        audioEl.className = 'player-bar';
        audioEl.src = URL.createObjectURL(item.blob);

        card.appendChild(topRow);
        card.appendChild(audioEl);
        libraryList.appendChild(card);
      }
    } catch (e) {
      console.error('Eroare redare biblioteca:', e);
    }
  }

  function showLoadingCard(message) {
    statusCard.classList.remove('hidden');
    statusCard.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'status-text';
    p.textContent = `⏳ ${message}`;
    statusCard.appendChild(p);
  }

  function showErrorCard(message) {
    statusCard.classList.remove('hidden');
    statusCard.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'error-text';
    p.textContent = `⚠️ ${message}`;
    statusCard.appendChild(p);
  }

  function appendStaticCloudMp3Widget(container, video) {
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-primary btn-full';
    retryBtn.textContent = '🔄 Reîncearcă Extragerea MP3';
    retryBtn.addEventListener('click', () => {
      startMp3Extraction(video);
    });
    container.appendChild(retryBtn);
  }

  function showVideoPreviewCard(video) {
    statusCard.classList.remove('hidden');
    statusCard.innerHTML = '';

    const row = document.createElement('div');
    row.className = 'preview-row';

    const img = document.createElement('img');
    img.className = 'preview-thumb';
    img.src = video.thumbnailUrl;
    img.alt = video.title;

    const meta = document.createElement('div');
    meta.className = 'preview-meta';

    const title = document.createElement('p');
    title.className = 'preview-title';
    title.textContent = video.title;

    const sub = document.createElement('p');
    sub.className = 'preview-sub';
    sub.textContent = `${video.uploader} • ${video.durationText}`;

    meta.appendChild(title);
    meta.appendChild(sub);
    row.appendChild(img);
    row.appendChild(meta);

    const dlBtn = document.createElement('button');
    dlBtn.type = 'button';
    dlBtn.className = 'btn btn-primary btn-full';
    dlBtn.textContent = '⬇️ Extrage și Descarcă MP3 Acum';
    dlBtn.addEventListener('click', () => {
      startMp3Extraction(video);
    });

    statusCard.appendChild(row);
    statusCard.appendChild(dlBtn);
  }

  let activePollTimer = null;

  async function startMp3Extraction(video) {
    if (activePollTimer) {
      clearTimeout(activePollTimer);
      activePollTimer = null;
    }

    statusCard.classList.remove('hidden');
    statusCard.innerHTML = '';

    const titleEl = document.createElement('p');
    titleEl.className = 'preview-title';
    titleEl.textContent = video.title;

    const progressEl = document.createElement('progress');
    progressEl.max = 100;
    progressEl.value = 10;

    const statusLineEl = document.createElement('p');
    statusLineEl.className = 'preview-sub';
    statusLineEl.textContent = 'Se inițializează extragerea audio...';

    statusCard.appendChild(titleEl);
    statusCard.appendChild(progressEl);
    statusCard.appendChild(statusLineEl);

    const jobStartHit = await fetchFromBackend('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: video.webpageUrl,
        quality: getSelectedQuality(),
        title: video.title
      })
    });

    if (jobStartHit) {
      try {
        const { res, base } = jobStartHit;
        const data = await res.json();
        const jobId = data.id;
        let isStopped = false;

        const pollOnce = async () => {
          if (isStopped) return;
          try {
            const pollRes = await fetch(`${base}/api/jobs/${jobId}`, { cache: 'no-store' });
            const job = await pollRes.json();
            if (!pollRes.ok) {
              throw new Error(job.error || 'Eroare la verificarea progresului.');
            }

            progressEl.value = job.progress || 10;
            statusLineEl.textContent = `${job.statusText} (${job.progress || 0}%)`;

            if (job.status === 'completed') {
              isStopped = true;
              if (activePollTimer) {
                clearTimeout(activePollTimer);
                activePollTimer = null;
              }

              const directFileUrl = `${base}/api/jobs/${jobId}/file`;
              const fileName = job.fileName || `${video.title}.mp3`;
              statusLineEl.textContent = 'Se descarcă fișierul MP3 de pe server...';

              let mp3Blob = null;
              try {
                const fileRes = await fetch(directFileUrl);
                if (!fileRes.ok) {
                  throw new Error('Nu s-a putut prelua fișierul MP3.');
                }
                mp3Blob = await fileRes.blob();
              } catch (_) {}

              if (mp3Blob) {
                try {
                  await Promise.race([
                    saveMp3ToLibrary({ fileName, blob: mp3Blob }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
                  ]);
                  await renderLibrary();
                } catch (_) {}

                try {
                  triggerBrowserDownload(mp3Blob, fileName);
                } catch (_) {}
              }

              statusCard.innerHTML = '';
              const doneTitle = document.createElement('p');
              doneTitle.className = 'preview-title';
              doneTitle.textContent = `✅ Gata: ${fileName}`;
              statusCard.appendChild(doneTitle);

              if (mp3Blob) {
                const shareBtn = document.createElement('button');
                shareBtn.type = 'button';
                shareBtn.className = 'btn btn-success';
                shareBtn.textContent = '📂 Salvează în Fișiere (iPhone) / Trimite pe WhatsApp';
                shareBtn.addEventListener('click', () => {
                  shareOrSaveOnIphone(mp3Blob, fileName);
                });
                statusCard.appendChild(shareBtn);
              }

              const directLink = document.createElement('a');
              directLink.href = directFileUrl;
              directLink.download = fileName;
              directLink.className = 'btn btn-secondary btn-full';
              directLink.style.textDecoration = 'none';
              directLink.textContent = '⬇️ Descarcă MP3 Direct (Safari / Fișiere)';
              statusCard.appendChild(directLink);
              return;
            } else if (job.status === 'error') {
              isStopped = true;
              if (activePollTimer) {
                clearTimeout(activePollTimer);
                activePollTimer = null;
              }
              showErrorCard(job.error || 'Conversia MP3 a eșuat.');
              return;
            }
          } catch (err) {
            isStopped = true;
            if (activePollTimer) {
              clearTimeout(activePollTimer);
              activePollTimer = null;
            }
            showErrorCard(err.message);
            return;
          }

          if (!isStopped) {
            activePollTimer = setTimeout(pollOnce, 750);
          }
        };

        activePollTimer = setTimeout(pollOnce, 650);
        return;
      } catch (_) {}
    }

    statusCard.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'preview-row';

    const img = document.createElement('img');
    img.className = 'preview-thumb';
    img.src = video.thumbnailUrl;
    img.alt = video.title;

    const meta = document.createElement('div');
    meta.className = 'preview-meta';

    const t = document.createElement('p');
    t.className = 'preview-title';
    t.textContent = video.title;

    const s = document.createElement('p');
    s.className = 'preview-sub';
    s.textContent = `${video.uploader} • ${video.durationText}`;

    meta.appendChild(t);
    meta.appendChild(s);
    row.appendChild(img);
    row.appendChild(meta);
    statusCard.appendChild(row);

    appendStaticCloudMp3Widget(statusCard, video);
  }

  async function handleInputSubmission(rawText, isFromPasteOrShare = false) {
    const trimmed = String(rawText || '').trim();
    if (!trimmed) return;

    const vid = extractVideoId(trimmed);
    if (vid) {
      showLoadingCard('Se preiau detaliile videoclipului de pe YouTube...');
      try {
        const video = await fetchVideoMetadata(trimmed);
        showVideoPreviewCard(video);
        if (isFromPasteOrShare && autoDownloadCheck.checked) {
          startMp3Extraction(video);
        }
      } catch (err) {
        showErrorCard(err.message);
      }
    } else {
      showLoadingCard(`Se caută pe YouTube: "${trimmed}"...`);
      try {
        const results = await searchYoutubeVideos(trimmed);
        statusCard.classList.add('hidden');
        renderSearchResults(results);
      } catch (err) {
        showErrorCard(err.message);
      }
    }
  }

  function renderSearchResults(results) {
    resultsSection.classList.remove('hidden');
    resultsTitle.textContent = `Rezultate YouTube (${results.length})`;
    resultsList.innerHTML = '';

    if (results.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card empty-state';
      empty.textContent = 'Niciun videoclip găsit.';
      resultsList.appendChild(empty);
      return;
    }

    for (const video of results) {
      const item = document.createElement('div');
      item.className = 'result-item';

      const thumbBox = document.createElement('div');
      thumbBox.className = 'thumb-box';

      const img = document.createElement('img');
      img.src = video.thumbnailUrl;
      img.alt = video.title;
      img.loading = 'lazy';

      const badge = document.createElement('span');
      badge.className = 'duration-badge';
      badge.textContent = video.durationText;

      thumbBox.appendChild(img);
      thumbBox.appendChild(badge);

      const info = document.createElement('div');
      info.className = 'item-info';
      info.addEventListener('click', () => {
        showVideoPreviewCard(video);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      const title = document.createElement('p');
      title.className = 'item-title';
      title.textContent = video.title;

      const sub = document.createElement('p');
      sub.className = 'item-sub';
      sub.textContent = video.uploader;

      info.appendChild(title);
      info.appendChild(sub);

      const dlBtn = document.createElement('button');
      dlBtn.type = 'button';
      dlBtn.className = 'btn-icon btn-download-pill';
      dlBtn.textContent = '⬇️ MP3';
      dlBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        startMp3Extraction(video);
      });

      item.appendChild(thumbBox);
      item.appendChild(info);
      item.appendChild(dlBtn);
      resultsList.appendChild(item);
    }
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleInputSubmission(queryInput.value, false);
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        queryInput.value = text.trim();
        handleInputSubmission(text.trim(), true);
      } else {
        showErrorCard('Clipboard-ul este gol. În aplicația YouTube apasă Share -> Copiază linkul.');
      }
    } catch (_) {
      queryInput.focus();
      showErrorCard('Ține apăsat în căsuța de căutare și alege „Lipește / Paste”.');
    }
  });

  const sharedUrlOrText = urlParams.get('url') || urlParams.get('text') || urlParams.get('q');
  if (sharedUrlOrText) {
    queryInput.value = sharedUrlOrText;
    handleInputSubmission(sharedUrlOrText, true);
  }

  renderLibrary();
})();
