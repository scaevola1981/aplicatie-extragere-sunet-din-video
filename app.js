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
  const installHelpBtn = document.getElementById('installHelpBtn');
  const installBanner = document.getElementById('installBanner');
  const importMp3Btn = document.getElementById('importMp3Btn');
  const importMp3Input = document.getElementById('importMp3Input');

  // Optional custom backend API URL (e.g. ?api=https://... or localStorage)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('api')) {
    const customApi = urlParams.get('api').replace(/\/+$/, '');
    localStorage.setItem('yt2mp3_api_base', customApi);
  }
  const configuredApiBase = localStorage.getItem('yt2mp3_api_base') || '';

  // Lista de servere publice Piped cu suport CORS pentru GitHub Pages
  const PUBLIC_PIPED_APIS = [
    'https://api.piped.private.coffee',
    'https://pipedapi.ducks.party',
    'https://pipedapi.kavin.rocks'
  ];

  autoDownloadCheck.checked = localStorage.getItem('yt2mp3_auto_dl') === '1';
  autoDownloadCheck.addEventListener('change', () => {
    localStorage.setItem('yt2mp3_auto_dl', autoDownloadCheck.checked ? '1' : '0');
  });

  installHelpBtn.addEventListener('click', () => {
    installBanner.classList.toggle('hidden');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

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

  // Căutare YouTube 100% Client-Side pentru GitHub Pages (cu fallback către backend dacă există)
  async function searchYoutubeVideos(query) {
    // 1. Încearcă backend-ul local/configurat dacă nu suntem pe github.io fără apiBase
    const isGitHubPages = window.location.hostname.endsWith('github.io');
    if (!isGitHubPages || configuredApiBase) {
      try {
        const res = await fetch(`${configuredApiBase}/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            return data.results;
          }
        }
      } catch (_) {}
    }

    // 2. Căutare directă din browser prin Piped Public APIs (CORS enabled, funcționează direct pe GitHub Pages)
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

  // Preluare detalii videoclip 100% Client-Side pentru GitHub Pages (prin noembed CORS)
  async function fetchVideoMetadata(rawUrlOrId) {
    const videoId = extractVideoId(rawUrlOrId);
    if (!videoId) throw new Error('Link YouTube invalid.');
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const isGitHubPages = window.location.hostname.endsWith('github.io');
    if (!isGitHubPages || configuredApiBase) {
      try {
        const res = await fetch(`${configuredApiBase}/api/info?url=${encodeURIComponent(watchUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.video) return data.video;
        }
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

  // IndexedDB pentru stocarea melodiilor MP3 direct pe iPhone / Android
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
        card.className = 'library-item';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'stretch';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.alignItems = 'center';
        topRow.style.justifyContent = 'space-between';
        topRow.style.gap = '10px';

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
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '6px';

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
    p.style.margin = '0';
    p.style.fontWeight = '600';
    p.textContent = `⏳ ${message}`;
    statusCard.appendChild(p);
  }

  function showErrorCard(message) {
    statusCard.classList.remove('hidden');
    statusCard.innerHTML = '';
    const p = document.createElement('p');
    p.style.margin = '0';
    p.style.color = '#ff8a80';
    p.style.fontWeight = '600';
    p.textContent = `⚠️ ${message}`;
    statusCard.appendChild(p);
  }

  // Pe GitHub Pages (fără server local), afișează convertorul Cloud MP3 integrat direct în card
  function appendStaticCloudMp3Widget(container, video) {
    const widgetWrap = document.createElement('div');
    widgetWrap.style.marginTop = '8px';
    widgetWrap.style.display = 'flex';
    widgetWrap.style.flexDirection = 'column';
    widgetWrap.style.gap = '8px';

    const note = document.createElement('p');
    note.className = 'preview-sub';
    note.textContent = 'Mod Static (GitHub Pages): Apasă pe butonul de mai jos pentru a descărca direct fișierul MP3 pe iPhone/Android:';

    const iframe = document.createElement('iframe');
    iframe.src = `https://loader.to/api/button/?url=${encodeURIComponent(video.webpageUrl)}&f=mp3&color=e53935`;
    iframe.style.width = '100%';
    iframe.style.height = '62px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.overflow = 'hidden';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('title', `Descarcă MP3 - ${video.title}`);

    widgetWrap.appendChild(note);
    widgetWrap.appendChild(iframe);
    container.appendChild(widgetWrap);
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
    dlBtn.className = 'btn btn-primary';
    dlBtn.style.width = '100%';
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
      clearInterval(activePollTimer);
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

    const isGitHubPages = window.location.hostname.endsWith('github.io');

    // Dacă avem backend local sau configurat, folosim motorul yt-dlp + FFmpeg
    if (!isGitHubPages || configuredApiBase) {
      try {
        const res = await fetch(`${configuredApiBase}/api/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: video.webpageUrl,
            quality: getSelectedQuality(),
            title: video.title
          })
        });
        if (res.ok) {
          const data = await res.json();
          const jobId = data.id;
          activePollTimer = setInterval(async () => {
            try {
              const pollRes = await fetch(`${configuredApiBase}/api/jobs/${jobId}`);
              const job = await pollRes.json();
              if (!pollRes.ok) {
                throw new Error(job.error || 'Eroare la verificarea progresului.');
              }

              progressEl.value = job.progress || 10;
              statusLineEl.textContent = `${job.statusText} (${job.progress || 0}%)`;

              if (job.status === 'completed') {
                clearInterval(activePollTimer);
                activePollTimer = null;

                statusLineEl.textContent = 'Se salvează fișierul MP3 pe telefon...';
                const fileRes = await fetch(`${configuredApiBase}/api/jobs/${jobId}/file`);
                if (!fileRes.ok) {
                  throw new Error('Nu s-a putut prelua fișierul MP3.');
                }
                const mp3Blob = await fileRes.blob();
                const fileName = job.fileName || `${video.title}.mp3`;

                await saveMp3ToLibrary({ fileName, blob: mp3Blob });
                await renderLibrary();
                triggerBrowserDownload(mp3Blob, fileName);

                statusCard.innerHTML = '';
                const doneTitle = document.createElement('p');
                doneTitle.className = 'preview-title';
                doneTitle.textContent = `✅ Descărcat: ${fileName}`;

                const shareBtn = document.createElement('button');
                shareBtn.type = 'button';
                shareBtn.className = 'btn btn-success';
                shareBtn.textContent = '📂 Salvează în Fișiere (iPhone) / Trimite pe WhatsApp';
                shareBtn.addEventListener('click', () => {
                  shareOrSaveOnIphone(mp3Blob, fileName);
                });

                statusCard.appendChild(doneTitle);
                statusCard.appendChild(shareBtn);
              } else if (job.status === 'error') {
                clearInterval(activePollTimer);
                activePollTimer = null;
                showErrorCard(job.error || 'Conversia MP3 a eșuat.');
              }
            } catch (err) {
              clearInterval(activePollTimer);
              activePollTimer = null;
              showErrorCard(err.message);
            }
          }, 650);
          return;
        }
      } catch (_) {}
    }

    // Fallback 100% Static pentru GitHub Pages (fără niciun server propriu)
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
      dlBtn.className = 'btn-icon';
      dlBtn.style.backgroundColor = 'var(--brand-color)';
      dlBtn.style.color = '#fff';
      dlBtn.style.border = 'none';
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
