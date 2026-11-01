const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

const PORT = process.env.PORT || 3080;
const PUBLIC_DIR = path.join(__dirname, 'public');
const BIN_DIR = path.join(__dirname, 'bin');
const TMP_BASE_DIR = path.join(os.tmpdir(), 'yt2mp3_jobs');

fs.mkdirSync(BIN_DIR, { recursive: true });
fs.mkdirSync(TMP_BASE_DIR, { recursive: true });

const jobs = new Map();

function findFfmpegDir() {
  const candidates = [
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return path.dirname(c);
    }
  }
  try {
    const found = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    if (found) return path.dirname(found);
  } catch (_) {}
  return null;
}

const FFMPEG_DIR = findFfmpegDir();

function getYtDlpPath() {
  const localBin = path.join(BIN_DIR, 'yt-dlp');
  if (fs.existsSync(localBin)) return localBin;
  try {
    const sys = execSync('which yt-dlp', { encoding: 'utf8' }).trim();
    if (sys) return sys;
  } catch (_) {}
  return localBin;
}

function downloadFileFollowRedirects(url, destPath) {
  return new Promise((resolve, reject) => {
    const request = (currentUrl, redirectsLeft = 5) => {
      if (redirectsLeft <= 0) {
        return reject(new Error('Prea multe redirectari la descarcarea yt-dlp'));
      }
      https.get(currentUrl, { headers: { 'User-Agent': 'YT2MP3-PWA/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const nextUrl = new URL(res.headers.location, currentUrl).toString();
          return request(nextUrl, redirectsLeft - 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} la descarcarea yt-dlp`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            fs.chmodSync(destPath, 0o755);
            resolve(destPath);
          });
        });
        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', reject);
    };
    request(url);
  });
}

let ytdlpReadyPromise = null;
async function ensureYtDlpBinary() {
  const binPath = getYtDlpPath();
  if (fs.existsSync(binPath)) {
    return binPath;
  }
  if (!ytdlpReadyPromise) {
    const target = path.join(BIN_DIR, 'yt-dlp');
    console.log('Se descarca motorul yt-dlp in ./bin/yt-dlp...');
    ytdlpReadyPromise = downloadFileFollowRedirects(
      'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
      target
    ).then((p) => {
      console.log('Motorul yt-dlp este gata:', p);
      return p;
    }).catch((err) => {
      ytdlpReadyPromise = null;
      throw err;
    });
  }
  return ytdlpReadyPromise;
}

function extractVideoId(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
  const match = text.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

async function searchYoutubeInnerTube(query, maxResults = 10) {
  const response = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://www.youtube.com',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'
    },
    body: JSON.stringify({
      query,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20250101.00.00',
          hl: 'ro',
          gl: 'RO'
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Eroare YouTube Search HTTP ${response.status}`);
  }

  const root = await response.json();
  const renderers = [];

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node.videoRenderer && typeof node.videoRenderer === 'object') {
      renderers.push(node.videoRenderer);
    }
    for (const k of Object.keys(node)) {
      walk(node[k]);
    }
  }

  walk(root);

  function getText(field) {
    if (!field || typeof field !== 'object') return null;
    if (typeof field.simpleText === 'string') return field.simpleText;
    if (Array.isArray(field.runs)) {
      return field.runs.map((r) => r.text || '').join('') || null;
    }
    return null;
  }

  const results = [];
  const seen = new Set();

  for (const vr of renderers) {
    const id = vr.videoId;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const title = getText(vr.title) || 'Videoclip YouTube';
    const uploader =
      getText(vr.ownerText) ||
      getText(vr.longBylineText) ||
      getText(vr.shortBylineText) ||
      'YouTube';
    const durationText = getText(vr.lengthText) || 'Audio';
    const thumbnailUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    results.push({
      id,
      title,
      uploader,
      durationText,
      thumbnailUrl,
      webpageUrl: `https://www.youtube.com/watch?v=${id}`
    });

    if (results.length >= maxResults) break;
  }

  return results;
}

async function fetchSingleVideoInfo(rawInput) {
  const videoId = extractVideoId(rawInput);
  if (!videoId) {
    throw new Error('Link-ul YouTube nu este valid.');
  }
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      return {
        id: videoId,
        title: data.title || 'Videoclip YouTube',
        uploader: data.author_name || 'YouTube',
        durationText: 'YouTube Audio',
        thumbnailUrl: data.thumbnail_url || thumbUrl,
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

function sanitizeFileName(raw) {
  const cleaned = String(raw || 'melodie')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'melodie').slice(0, 100);
}

async function startMp3Job({ url, quality = '0', title = 'Melodie YouTube' }) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Link YouTube invalid.');
  }
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const jobId = crypto.randomUUID();
  const jobDir = path.join(TMP_BASE_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const job = {
    id: jobId,
    title,
    status: 'running',
    progress: 5,
    statusText: 'Se pregătește extragerea audio...',
    filePath: null,
    fileName: null,
    error: null,
    createdAt: Date.now()
  };
  jobs.set(jobId, job);

  (async () => {
    try {
      const ytdlpBin = await ensureYtDlpBinary();
      const validQualities = new Set(['0', '192K', '128K']);
      const qArg = validQualities.has(quality) ? quality : '0';

      const args = [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', qArg,
        '--add-metadata',
        '--no-playlist',
        '--newline',
        '-o', path.join(jobDir, '%(title).100s.%(ext)s')
      ];

      if (FFMPEG_DIR) {
        args.push('--ffmpeg-location', FFMPEG_DIR);
      }

      args.push(canonicalUrl);

      await new Promise((resolve, reject) => {
        const proc = spawn(ytdlpBin, args, {
          env: {
            ...process.env,
            PATH: `${FFMPEG_DIR ? FFMPEG_DIR + ':' : ''}/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
          }
        });

        let stderrBuf = '';

        const handleLine = (line) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          const pctMatch = trimmed.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
          if (pctMatch) {
            const dlPct = parseFloat(pctMatch[1]);
            job.progress = Math.min(82, Math.max(8, Math.round(dlPct * 0.8)));
            job.statusText = `Descărcare flux audio: ${Math.round(dlPct)}%`;
          } else if (/\[ExtractAudio\]/i.test(trimmed)) {
            job.progress = 90;
            job.statusText = 'Conversie în format MP3 (FFmpeg)...';
          } else if (/\[Metadata\]/i.test(trimmed)) {
            job.progress = 96;
            job.statusText = 'Se adaugă metadatele ID3 în MP3...';
          }
        };

        proc.stdout.on('data', (chunk) => {
          String(chunk).split(/\r?\n/).forEach(handleLine);
        });

        proc.stderr.on('data', (chunk) => {
          const text = String(chunk);
          stderrBuf += text;
          text.split(/\r?\n/).forEach(handleLine);
        });

        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(stderrBuf.trim().split('\n').pop() || `yt-dlp exit code ${code}`));
          }
        });
      });

      const files = fs.readdirSync(jobDir);
      const mp3File = files.find((f) => f.toLowerCase().endsWith('.mp3')) || files[0];
      if (!mp3File) {
        throw new Error('Fișierul MP3 nu a putut fi generat.');
      }

      job.filePath = path.join(jobDir, mp3File);
      job.fileName = sanitizeFileName(path.parse(mp3File).name) + '.mp3';
      job.progress = 100;
      job.status = 'completed';
      job.statusText = 'Conversie MP3 completă!';
    } catch (err) {
      job.status = 'error';
      job.error = err.message || 'Eroare la extragerea MP3.';
      job.statusText = job.error;
    }
  })();

  return job;
}

// Curatare periodica a joburilor mai vechi de 30 minute
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      try {
        fs.rmSync(path.join(TMP_BASE_DIR, id), { recursive: true, force: true });
      } catch (_) {}
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000).unref();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/search' && req.method === 'GET') {
      const q = (parsedUrl.searchParams.get('q') || '').trim();
      if (!q) return sendJson(res, 400, { error: 'Introdu un termen de căutare.' });
      const results = await searchYoutubeInnerTube(q, 10);
      return sendJson(res, 200, { results });
    }

    if (pathname === '/api/info' && req.method === 'GET') {
      const url = (parsedUrl.searchParams.get('url') || '').trim();
      if (!url) return sendJson(res, 400, { error: 'Lipsește link-ul YouTube.' });
      const video = await fetchSingleVideoInfo(url);
      return sendJson(res, 200, { video });
    }

    if (pathname === '/api/jobs' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body.url) return sendJson(res, 400, { error: 'Lipsește link-ul videoclipului.' });
      const job = await startMp3Job({
        url: body.url,
        quality: body.quality || '0',
        title: body.title || 'Melodie YouTube'
      });
      return sendJson(res, 200, {
        id: job.id,
        status: job.status,
        progress: job.progress,
        statusText: job.statusText
      });
    }

    const jobMatch = pathname.match(/^\/api\/jobs\/([a-f0-9-]+)(?:\/(file))?$/i);
    if (jobMatch && req.method === 'GET') {
      const jobId = jobMatch[1];
      const isFileRequest = jobMatch[2] === 'file';
      const job = jobs.get(jobId);

      if (!job) {
        return sendJson(res, 404, { error: 'Sesiunea de descărcare nu a fost găsită.' });
      }

      if (!isFileRequest) {
        return sendJson(res, 200, {
          id: job.id,
          title: job.title,
          status: job.status,
          progress: job.progress,
          statusText: job.statusText,
          fileName: job.fileName,
          error: job.error
        });
      }

      if (job.status !== 'completed' || !job.filePath || !fs.existsSync(job.filePath)) {
        return sendJson(res, 400, { error: 'Fișierul MP3 nu este încă gata.' });
      }

      const stat = fs.statSync(job.filePath);
      const asciiFallback = job.fileName.replace(/[^\x20-\x7E]+/g, '_');
      const encodedName = encodeURIComponent(job.fileName);

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      });

      fs.createReadStream(job.filePath).pipe(res);
      return;
    }

    // Servire fisiere statice PWA din ./public
    let safePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' || ext === '.js' ? 'no-cache' : 'public, max-age=3600'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const indexFile = path.join(PUBLIC_DIR, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexFile).pipe(res);
    }
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: err.message || 'Eroare internă server.' });
  }
});

function getLocalNetworkIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🎵 YT2MP3 PWA Server pornit pe portul ${PORT}`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  for (const ip of getLocalNetworkIPs()) {
    console.log(`📱 Pe iPhone / Android (același Wi-Fi): http://${ip}:${PORT}`);
  }
  console.log(`==================================================\n`);
  ensureYtDlpBinary().catch((err) => {
    console.error('Atentie la pregatirea yt-dlp:', err.message);
  });
});
