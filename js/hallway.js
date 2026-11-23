/* Soheean High: Hallway Pass — first-person 3D hallway (three.js, no build step)
 * Every texture is painted at runtime on <canvas>, so the site ships no image files. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = (s, r = document) => r.querySelector(s);
const body = document.body;
const sheet = $('#sheet');
const sheetBody = $('#sheetBody');
const btnSkip = $('#btnSkip');
const hudPrompt = $('#hudPrompt');
const tcAct = $('#tcAct');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;

/* ==========================================================
   Page modes (hallway ↔ one-page portfolio) and dialogs
   ========================================================== */
let resize = () => {};
body.classList.remove('no-js');
const startInPage = location.hash === '#portfolio' || new URLSearchParams(location.search).has('skip');
setMode(startInPage ? 'page' : 'game');

function setMode(mode) {
  body.classList.toggle('mode-game', mode === 'game');
  body.classList.toggle('mode-page', mode === 'page');
  btnSkip.setAttribute('aria-pressed', String(mode === 'page'));
  if (mode === 'page') {
    if (sheet.open) sheet.close();
    window.scrollTo(0, 0);
    $('#portfolio').focus({ preventScroll: true });
  } else {
    requestAnimationFrame(() => resize());
  }
}
btnSkip.addEventListener('click', () => {
  const toPage = body.classList.contains('mode-game');
  setMode(toPage ? 'page' : 'game');
  history.replaceState(null, '', toPage ? '#portfolio' : location.pathname);
});

function openSection(id) {
  const src = document.getElementById(id);
  if (!src) return;
  clearInput();
  const clone = src.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  const h = clone.querySelector('h2');
  if (h) h.id = 'sheetTitle';
  sheetBody.replaceChildren(clone);
  sheet.showModal();
  sheetBody.scrollTop = 0;
}
$('#sheetClose').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

/* ==========================================================
   Renderer
   ========================================================== */
const canvas = $('#scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  // No WebGL → the one-page portfolio is the site.
  btnSkip.hidden = true;
  setMode('page');
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

/* ==========================================================
   Layout
   ========================================================== */
const L = 42;            // hallway length (m), runs from z=0 to z=-L
const W = 4.4;           // hallway width
const H = 3.2;           // ceiling height
const HX = W / 2;
const EYE = 1.62;

const COLORS = {
  ink: '#3B3633', cream: '#FBF7F0', wall: '#F6EEDF', sage: '#B7C9A8', sageD: '#8FA67E',
  pink: '#E8B4B8', pinkD: '#D4959A', butter: '#F6E3A1', mint: '#CFE8DF', mintD: '#A9D2C3',
  navy: '#34496B', mustard: '#E3A951', wood: '#B88A5C', green: '#2F4A3E', brick: '#A65A45', plaid: '#F2D16B',
};

// Things you can open. side: which wall (L = lockers, R = doors/boards). z is snapped for lockers.
const STATIONS = [
  { id: 'about',     title: 'Bulletin Board', ko: '학생증 · About Me',      side: 'R', z: -4.5,  dot: COLORS.sage },
  { id: 'p-firegen', title: 'My Locker ★',    ko: 'FireGenerators (대표)',   side: 'L', z: -8,    dot: COLORS.pink },
  { id: 'p-eatwise', title: 'Locker 101',     ko: 'EatWise',               side: 'L', z: -12.4, dot: COLORS.mint },
  { id: 'jukebox',   title: 'Cafeteria',      ko: '주크박스 · 플레이리스트',   side: 'R', z: -15.8, dot: COLORS.pinkD },
  { id: 'p-farm',    title: 'Locker 102',     ko: '농업 일자리 매칭',          side: 'L', z: -19.2, dot: COLORS.butter },
  { id: 'p-review',  title: 'Locker 103',     ko: '리뷰 별점 예측',            side: 'L', z: -22.8, dot: COLORS.butter },
  { id: 'yearbook',  title: 'Yearbook Room',  ko: "졸업앨범실 · Class of '22", side: 'R', z: -27,   dot: COLORS.mustard },
  { id: 'p-campus',  title: 'Locker 104',     ko: '캠퍼스 제휴 앱',            side: 'L', z: -31.2, dot: COLORS.mintD },
  { id: 'office',    title: 'Main Office',    ko: '교무실 · 성적표(이력서) 발급', side: 'R', z: -36,   dot: COLORS.navy },
];
const byId = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
const VIEW_BACK = 1.35;  // stand this far "before" a station so it sits at a comfy diagonal

/* ==========================================================
   Canvas texture helpers
   ========================================================== */
const F_BODY = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif';
const F_HAND = 'Caveat, Gaegu, cursive';
const F_HAND_KO = 'Gaegu, Caveat, cursive';

const ALL_TEXT = STATIONS.map((s) => s.title + s.ko).join('') +
  '안소희 soheean1370 Hallway Pass HALLWAY PASS SOHEEAN HIGH SCHOOL WELCOME TO ♡★✶☕♪ 0123456789 ' +
  'Fire Generators EatWise 농업 일자리 리뷰 별점 캠퍼스 제휴 앱 HOMECOMING AI CLUB SPIRIT WEEK PLAID DAY FRIDAY Coffee & Code VOTE Most Likely to Build an AI Yearbook photos Thursday smile GO BUILDERS CAFETERIA Jukebox YEARBOOK ROOM MAIN OFFICE Transcripts EXIT me class of PNU ✈ Gen ML MLOps Vision github.com';
await Promise.race([
  Promise.all([
    document.fonts.load(`700 48px ${F_BODY}`, ALL_TEXT),
    document.fonts.load('700 48px Caveat', ALL_TEXT),
    document.fonts.load('700 48px Gaegu', ALL_TEXT),
  ]).catch(() => {}),
  new Promise((r) => setTimeout(r, 2500)),
]);

function canvasTex(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * (amt > 0 ? 255 - v : v))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function speckle(g, x, y, w, h, n, alpha, r, colors) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * (0.3 + r() * 0.7);
    g.fillStyle = colors[(r() * colors.length) | 0];
    const s = 0.8 + r() * 2.2;
    g.fillRect(x + r() * w, y + r() * h, s, s);
  }
  g.globalAlpha = 1;
}
function plaid(g, x, y, w, h, base = COLORS.plaid, step = 64) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = base; g.fillRect(x, y, w, h);
  const bands = (horizontal) => {
    for (let k = -step; k < (horizontal ? h : w) + step; k += step) {
      const put = (o, s, c) => { g.fillStyle = c; horizontal ? g.fillRect(x, y + k + o, w, s) : g.fillRect(x + k + o, y, s, h); };
      put(0, step * 0.22, 'rgba(45,40,38,.26)');
      put(step * 0.42, step * 0.06, 'rgba(255,255,255,.5)');
      put(step * 0.62, step * 0.05, 'rgba(176,52,52,.28)');
      put(step * 0.8, step * 0.03, 'rgba(45,40,38,.35)');
    }
  };
  bands(false); bands(true);
  g.restore();
}
function text(g, str, x, y, font, color = COLORS.ink, align = 'center', base = 'middle', maxW) {
  g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  maxW ? g.fillText(str, x, y, maxW) : g.fillText(str, x, y);
}
function tape(g, x, y, w, h, rot, color) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = 0.85; g.fillStyle = color; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
}
function drawAvatar(g, cx, cy, s) { // little illustrated portrait, s = size in px
  g.save(); g.translate(cx - s / 2, cy - s / 2); g.scale(s / 120, s / 120);
  g.fillStyle = COLORS.mint; g.fillRect(0, 0, 120, 120);
  g.fillStyle = COLORS.pink; g.beginPath(); g.moveTo(22, 120); g.bezierCurveTo(26, 94, 42, 82, 60, 82); g.bezierCurveTo(78, 82, 94, 94, 98, 120); g.fill();
  g.fillStyle = '#4a3a33'; g.beginPath(); g.ellipse(60, 56, 31, 36, 0, 0, Math.PI * 2); g.fill(); g.fillRect(29, 56, 62, 36);
  g.fillStyle = '#f6dccb'; g.beginPath(); g.ellipse(60, 60, 22, 25, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a3a33'; g.beginPath(); g.ellipse(60, 40, 25, 11, 0, Math.PI, Math.PI * 2); g.fill();
  g.fillStyle = COLORS.ink; g.beginPath(); g.arc(51, 61, 2.6, 0, 7); g.arc(69, 61, 2.6, 0, 7); g.fill();
  g.fillStyle = 'rgba(232,180,184,.85)'; g.beginPath(); g.ellipse(46, 69, 4, 2.4, 0, 0, 7); g.ellipse(74, 69, 4, 2.4, 0, 0, 7); g.fill();
  g.strokeStyle = COLORS.ink; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(55, 72); g.quadraticCurveTo(60, 76, 65, 72); g.stroke();
  g.restore();
}
function stickyNote(g, x, y, w, h, rot, color, lines, size = 30) {
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
  g.fillStyle = color; g.fillRect(-w / 2, -h / 2, w, h); g.shadowColor = 'transparent';
  lines.forEach((ln, i) => text(g, ln, 0, -((lines.length - 1) * size * 0.55) + i * size * 1.1, `700 ${size}px ${F_HAND_KO}`));
  g.restore();
}
function polaroid(g, x, y, w, rot, drawInside, caption) {
  const h = w * 1.18;
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,.2)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
  g.fillStyle = '#fff'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowColor = 'transparent';
  const p = w * 0.07, iw = w - p * 2;
  g.save(); g.translate(-w / 2 + p, -h / 2 + p); g.beginPath(); g.rect(0, 0, iw, iw); g.clip(); drawInside(g, iw); g.restore();
  text(g, caption, 0, h / 2 - (h - iw - p) / 2 + 2, `700 ${Math.round(w * 0.13)}px ${F_HAND}`);
  g.restore();
}

/* ---------- surfaces ---------- */
const floorTex = canvasTex(1024, 1024, (g, w, h) => {
  const r = rng(7);
  g.fillStyle = '#F3EDE2'; g.fillRect(0, 0, w, h);
  speckle(g, 0, 0, w, h, 26000, 0.55, r, ['#b9ad9c', '#d8cdbd', '#8f8478', '#e9c9a0', '#a8b8c9']);
  const n = 8, s = w / n;
  const cols = [COLORS.mustard, COLORS.navy, COLORS.pink, '#9DB58B'];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if ((i * 3 + j * 5) % 7 === 0) {
      g.fillStyle = cols[(i + j * 2) % cols.length];
      g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
      speckle(g, i * s + 3, j * s + 3, s - 6, s - 6, 500, 0.35, r, ['#ffffff', '#2b2b2b']);
    }
    g.strokeStyle = 'rgba(120,100,80,.10)'; g.lineWidth = 2; g.strokeRect(i * s, j * s, s, s);
  }
}, { repeat: [1, L / W] });

function wallPainter(g, w, h) { // 1024 x 820 ≈ 4m x 3.2m (256 px/m)
  const r = rng(3);
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#FAF3E6'); grd.addColorStop(1, '#F2E8D6');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  const top = h - 1.05 * 256;
  g.fillStyle = '#CFDDC4'; g.fillRect(0, top, w, h - top);
  for (let x = 0; x < w; x += 256) { g.fillStyle = 'rgba(90,110,80,.16)'; g.fillRect(x + 2, top + 18, 3, h - top - 46); }
  g.fillStyle = COLORS.wood; g.fillRect(0, top - 12, w, 20);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, top - 10, w, 4);
  g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, top + 8, w, 5);
  g.fillStyle = '#7A6656'; g.fillRect(0, h - 28, w, 28);
  speckle(g, 0, 0, w, h, 6000, 0.12, r, ['#a89a88', '#ffffff']);
}
const wallTex = canvasTex(1024, 820, wallPainter, { repeat: [L / 4, 1] });

const ceilTex = canvasTex(512, 512, (g, w, h) => {
  const r = rng(11);
  g.fillStyle = '#F7F3EC'; g.fillRect(0, 0, w, h);
  speckle(g, 0, 0, w, h, 9000, 0.35, r, ['#b8b0a2', '#d6cfc3']);
  g.fillStyle = '#DCD3C5';
  for (let k = 0; k <= w; k += 128) { g.fillRect(k - 2, 0, 4, h); g.fillRect(0, k - 2, w, 4); }
}, { repeat: [W / 2.4, L / 2.4] });

const brickTex = canvasTex(512, 512, (g, w, h) => { // 2m x 2m
  const r = rng(5);
  g.fillStyle = '#E6D9C8'; g.fillRect(0, 0, w, h);
  const bw = 52, bh = 17;
  for (let row = 0, y = 0; y < h; row++, y += bh + 3) {
    for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw + 3) {
      const v = (r() - 0.5) * 22;
      g.fillStyle = shade(COLORS.brick, v);
      g.fillRect(x, y, bw, bh);
    }
  }
  speckle(g, 0, 0, w, h, 5000, 0.25, r, ['#000000', '#ffffff']);
}, { repeat: [0.5, 0.5] });

const pavementTex = canvasTex(512, 512, (g, w, h) => {
  const r = rng(9);
  g.fillStyle = '#E4DCCF'; g.fillRect(0, 0, w, h);
  speckle(g, 0, 0, w, h, 12000, 0.3, r, ['#9e968a', '#ffffff']);
  g.fillStyle = 'rgba(110,100,90,.25)';
  for (let k = 0; k <= w; k += 256) { g.fillRect(k - 2, 0, 4, h); g.fillRect(0, k - 2, w, 4); }
}, { repeat: [15, 7] });

/* ---------- lockers ---------- */
function lockerPainter({ base, num, kind, note, noteColor, label }) {
  return canvasTex(256, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, shade(base, 14)); grd.addColorStop(0.55, base); grd.addColorStop(1, shade(base, -12));
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    const vents = (y0) => {
      for (let k = 0; k < 5; k++) {
        const y = y0 + k * 24;
        g.fillStyle = 'rgba(40,35,30,.42)'; rr(g, 62, y, 132, 11, 5); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(64, y + 11, 128, 3);
      }
    };
    vents(46); vents(870);
    g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, 198, 468, 30, 124, 8); g.fill();
    g.fillStyle = '#ECE8E2'; rr(g, 203, 476, 20, 108, 6); g.fill();
    if (num) {
      g.fillStyle = '#FFFDF8'; rr(g, 86, 196, 84, 36, 6); g.fill();
      text(g, num, 128, 215, `700 24px ${F_BODY}`);
    }
    if (kind === 'mine') {
      polaroid(g, 34, 262, 132, -0.1, (pg, s) => drawAvatar(pg, s / 2, s / 2, s), 'me ♡');
      // combination dial
      g.save(); g.translate(160, 440);
      g.fillStyle = '#F4F1EC'; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
      g.strokeStyle = COLORS.ink; g.lineWidth = 2; g.stroke();
      for (let a = 0; a < 20; a++) { g.save(); g.rotate((a / 20) * Math.PI * 2); g.fillRect(-1, -24, 2, a % 5 ? 4 : 8); g.restore(); }
      g.fillStyle = '#d9d4cf'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill();
      g.restore();
      g.save(); g.translate(128, 690); g.rotate(-0.06);
      g.fillStyle = COLORS.butter; g.fillRect(-92, -28, 184, 56);
      text(g, 'SOHEEAN', 0, 2, `700 46px ${F_HAND}`);
      g.restore();
      stickyNote(g, 40, 742, 150, 110, 0.05, COLORS.mint, ['Fire', 'Generators'], 30);
      // star + heart stickers
      g.fillStyle = '#F2C94C'; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr2 = i % 2 ? 11 : 26; g.lineTo(200 + Math.cos(a) * rr2, 640 + Math.sin(a) * rr2); }
      g.fill();
      g.fillStyle = '#E58C96'; g.beginPath(); g.moveTo(210, 820); g.bezierCurveTo(240, 790, 222, 768, 210, 784); g.bezierCurveTo(198, 768, 180, 790, 210, 820); g.fill();
    }
    if (note) stickyNote(g, 40, 270, 176, 150, 0.06, noteColor, label, label.length > 1 ? 32 : 38);
  });
}

/* ---------- doors & signs ---------- */
function windowGlow(g, x, y, w, h, extra) {
  const grd = g.createLinearGradient(x, y, x + w, y + h);
  grd.addColorStop(0, '#FFF6DA'); grd.addColorStop(1, '#F7D9A8');
  g.fillStyle = grd; g.fillRect(x, y, w, h);
  extra?.(g);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(x + w * 0.2, y + h); g.lineTo(x + w * 0.75, y); g.stroke();
  g.strokeStyle = '#E9E3D8'; g.lineWidth = 10; g.strokeRect(x, y, w, h);
}
function doorPainter({ color, kind }) {
  return canvasTex(512, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, shade(color, 8)); grd.addColorStop(1, shade(color, -8));
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 4; g.strokeRect(60, 480, 392, 360);
    if (kind === 'office') {
      windowGlow(g, 70, 100, 372, 300, (gg) => { text(gg, 'Transcripts', 256, 210, `700 54px ${F_HAND}`, COLORS.navy); text(gg, '→ ask here!', 256, 270, `700 40px ${F_HAND}`, COLORS.pinkD); });
    } else if (kind === 'yearbook') {
      windowGlow(g, 300, 100, 130, 330, (gg) => {
        gg.fillStyle = COLORS.navy; gg.beginPath(); gg.moveTo(310, 150); gg.lineTo(420, 175); gg.lineTo(310, 200); gg.fill();
        text(gg, "'22", 345, 176, `700 26px ${F_HAND}`, COLORS.butter);
      });
      stickyNote(g, 70, 150, 170, 150, -0.05, COLORS.pink, ['yearbook', 'photos Thu!'], 30);
    } else {
      windowGlow(g, 300, 100, 130, 330);
    }
    g.fillStyle = '#C9C4BC'; g.fillRect(0, 900, w, 96);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, 904, w, 6);
    g.fillStyle = '#D9D4CC'; rr(g, 40, 520, 90, 22, 10); g.fill();
    g.fillStyle = '#BDB7AE'; g.beginPath(); g.arc(120, 531, 18, 0, 7); g.fill();
  });
}
function cafeDoorPainter() {
  return canvasTex(1024, 1024, (g, w, h) => {
    for (const x0 of [0, 512]) {
      const grd = g.createLinearGradient(x0, 0, x0 + 512, 0);
      grd.addColorStop(0, shade(COLORS.pink, 10)); grd.addColorStop(1, shade(COLORS.pink, -8));
      g.fillStyle = grd; g.fillRect(x0, 0, 512, h);
      g.save(); g.beginPath(); g.arc(x0 + 256, 290, 120, 0, 7); g.clip();
      windowGlow(g, x0 + 130, 165, 260, 260, (gg) => text(gg, '♪', x0 + 256, 296, `700 110px ${F_BODY}`, COLORS.pinkD));
      g.restore();
      g.strokeStyle = '#FFFDF8'; g.lineWidth = 14; g.beginPath(); g.arc(x0 + 256, 290, 120, 0, 7); g.stroke();
      g.fillStyle = '#E8E3DB'; rr(g, x0 + 60, 560, 392, 34, 16); g.fill();
      g.fillStyle = '#C9C4BC'; g.fillRect(x0, 900, 512, 96);
    }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(508, 0, 8, h);
  });
}
function signPainter(label, { bg = '#FFFDF8', fg = COLORS.ink, font = `800 92px ${F_BODY}`, glow, w = 1024, h = 256, sub } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; rr(g, 8, 8, w - 16, h - 16, 26); g.fill();
    g.strokeStyle = 'rgba(59,54,51,.25)'; g.lineWidth = 6; g.stroke();
    if (glow) { g.shadowColor = glow; g.shadowBlur = 28; }
    g.letterSpacing = '4px';
    text(g, label, w / 2, sub ? h * 0.42 : h / 2 + 4, font, fg, 'center', 'middle', w - 90);
    g.letterSpacing = '0px';
    g.shadowColor = 'transparent';
    if (sub) text(g, sub, w / 2, h * 0.76, `600 ${Math.round(h * 0.15)}px ${F_BODY}`, shade(fg === '#FFFDF8' ? COLORS.ink : fg, 25));
  });
}
function tagPainter(title, ko, active) {
  return canvasTex(768, 200, (g, w, h) => {
    g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 14; g.shadowOffsetY = 5;
    g.fillStyle = active ? COLORS.butter : 'rgba(255,253,248,.96)'; rr(g, 12, 12, w - 24, h - 30, 80); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = active ? COLORS.ink : 'rgba(59,54,51,.25)'; g.lineWidth = active ? 5 : 3; g.stroke();
    text(g, title + (active ? '  ↵' : ''), w / 2, 76, `700 66px ${F_HAND}`, COLORS.ink, 'center', 'middle', w - 100);
    text(g, ko, w / 2, 136, `600 34px ${F_BODY}`, '#6E6560', 'center', 'middle', w - 100);
  });
}
function posterPainter({ bg, title, lines, plaidBg, titleColor = COLORS.ink, tapeColor = COLORS.butter, seed = 1 }) {
  return canvasTex(512, 700, (g, w, h) => {
    if (plaidBg) plaid(g, 0, 0, w, h, COLORS.plaid, 72); else { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    if (plaidBg) { g.fillStyle = 'rgba(255,253,248,.92)'; rr(g, 40, 170, w - 80, 360, 20); g.fill(); }
    const r = rng(seed);
    speckle(g, 0, 0, w, h, 900, 0.12, r, ['#000', '#fff']);
    text(g, title[0], w / 2, 250, `700 ${title[0].length > 9 ? 80 : 96}px ${F_HAND}`, titleColor);
    if (title[1]) text(g, title[1], w / 2, 335, `700 76px ${F_HAND}`, titleColor);
    lines.forEach((ln, i) => text(g, ln, w / 2, 430 + i * 52, `600 36px ${F_BODY}`));
    tape(g, 60, 28, 120, 34, -0.5, tapeColor); tape(g, w - 60, 28, 120, 34, 0.5, tapeColor);
  });
}
function pennantPainter(label, color, fg) {
  return canvasTex(900, 300, (g, w, h) => {
    g.fillStyle = color; g.beginPath(); g.moveTo(0, 20); g.lineTo(w, h / 2); g.lineTo(0, h - 20); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 20, 34, h - 40);
    text(g, label, 330, h / 2 + 4, `700 92px ${F_HAND}`, fg);
  });
}
function bannerPainter(label) {
  return canvasTex(1600, 220, (g, w, h) => {
    plaid(g, 0, 0, w, h, COLORS.plaid, 64);
    g.fillStyle = 'rgba(255,253,248,.95)'; rr(g, 200, 40, w - 400, h - 80, 70); g.fill();
    text(g, label, w / 2, h / 2 + 4, `700 92px ${F_HAND}`);
  });
}
function bulletinPainter() {
  return canvasTex(1100, 650, (g, w, h) => {
    const r = rng(21);
    g.fillStyle = '#CDA477'; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 16000, 0.45, r, ['#8d6a45', '#e9c9a0', '#6f5236']);
    g.strokeStyle = COLORS.wood; g.lineWidth = 36; g.strokeRect(0, 0, w, h);
    plaid(g, 180, 46, 740, 84, COLORS.plaid, 40);
    g.fillStyle = 'rgba(255,253,248,.95)'; rr(g, 250, 58, 600, 60, 30); g.fill();
    text(g, 'WELCOME TO SOHEEAN HIGH ♡', 550, 90, `800 34px ${F_BODY}`);
    // ID card
    g.save(); g.translate(300, 340); g.rotate(-0.05);
    g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
    g.fillStyle = '#fff'; rr(g, -220, -140, 440, 280, 18); g.fill(); g.shadowColor = 'transparent';
    g.save(); rr(g, -220, -140, 440, 52, [18, 18, 0, 0]); g.clip(); plaid(g, -220, -140, 440, 52, COLORS.plaid, 30); g.restore();
    g.fillStyle = 'rgba(255,253,248,.92)'; rr(g, -150, -128, 300, 28, 6); g.fill();
    text(g, 'HALLWAY PASS · 2026', 0, -113, `800 20px ${F_BODY}`);
    g.save(); g.beginPath(); g.rect(-196, -66, 140, 140); g.clip(); drawAvatar(g, -126, 4, 140); g.restore();
    text(g, '안소희', 10, -40, `800 44px ${F_BODY}`, COLORS.ink, 'left');
    text(g, 'soheean1370', 10, 6, `600 26px ${F_BODY}`, '#6E6560', 'left');
    text(g, 'PNU CSE · CRHSN \'22', 10, 42, `600 22px ${F_BODY}`, '#6E6560', 'left');
    for (let i = 0; i < 26; i++) { g.fillStyle = COLORS.ink; g.fillRect(-196 + i * 6, 98, i % 3 ? 2 : 4, 26); }
    g.restore();
    polaroid(g, 590, 180, 210, 0.08, (pg, s) => {
      const gr = pg.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#F7C9A6'); gr.addColorStop(1, '#C9DCE6');
      pg.fillStyle = gr; pg.fillRect(0, 0, s, s);
      pg.fillStyle = 'rgba(255,240,200,.95)'; pg.beginPath(); pg.arc(s * 0.7, s * 0.35, s * 0.12, 0, 7); pg.fill();
      pg.fillStyle = '#8FA67E'; pg.fillRect(0, s * 0.72, s, s * 0.28);
    }, "class of '22 ✈ PNU");
    stickyNote(g, 850, 190, 190, 170, 0.06, COLORS.butter, ['#Gen AI', '#ML #MLOps', '#Vision'], 30);
    stickyNote(g, 840, 420, 200, 140, -0.05, COLORS.pink, ['github.com/', 'soheean1370'], 28);
    for (const [px, py, c] of [[300, 200, '#E58C96'], [695, 190, '#6C8FB8'], [945, 196, '#8FA67E'], [940, 424, '#E3A951']]) {
      g.fillStyle = c; g.beginPath(); g.arc(px, py, 11, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(px - 3, py - 3, 4, 0, 7); g.fill();
    }
  });
}
const endWindowTex = canvasTex(1024, 640, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#CFE3EA'); gr.addColorStop(0.6, '#FBE9C6'); gr.addColorStop(1, '#F7D7A8');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const sun = g.createRadialGradient(760, 170, 10, 760, 170, 360);
  sun.addColorStop(0, 'rgba(255,250,225,1)'); sun.addColorStop(1, 'rgba(255,250,225,0)');
  g.fillStyle = sun; g.fillRect(0, 0, w, h);
  const r = rng(4);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = ['#B7C9A8', '#A7BD96', '#C8D7B6'][i % 3];
    g.beginPath(); g.arc(r() * w, h - 40 - r() * 90, 60 + r() * 70, 0, 7); g.fill();
  }
  g.fillStyle = '#FFFDF8';
  for (const x of [0, w / 3, (2 * w) / 3, w]) g.fillRect(x - 10, 0, 20, h);
  g.fillRect(0, h * 0.42, w, 16); g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
});
const glowTex = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,240,205,1)'); gr.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const shaftTex = canvasTex(128, 512, (g, w, h) => {
  const v = g.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(255,238,200,.9)'); v.addColorStop(1, 'rgba(255,238,200,0)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  const hz = g.createLinearGradient(0, 0, w, 0);
  hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.5, 'rgba(0,0,0,1)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hz; g.fillRect(0, 0, w, h);
});
const skyTex = canvasTex(4, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#BFD9E6'); gr.addColorStop(0.55, '#EAF0EA'); gr.addColorStop(1, '#FBEBD0');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

/* ==========================================================
   Scene
   ========================================================== */
const scene = new THREE.Scene();
scene.background = skyTex;
scene.fog = new THREE.Fog(0xf3e6d0, 14, 50);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

scene.add(new THREE.HemisphereLight(0xfff1dc, 0xcdb89c, 1.0));
const sunOut = new THREE.DirectionalLight(0xfff0d6, 2.2);
sunOut.position.set(6, 9, 12);
scene.add(sunOut);
const sunIn = new THREE.DirectionalLight(0xffe2b0, 0.9);
sunIn.position.set(0, 3, -L - 6); sunIn.target.position.set(0, 0, -L + 10);
scene.add(sunIn, sunIn.target);
for (let z = -3; z > -L; z -= 7) {
  const p = new THREE.PointLight(0xfff1dc, 5, 10, 1.3);
  p.position.set(0, H - 0.3, z);
  scene.add(p);
}

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
const box = (w, h, d, mat, x, y, z, parent = scene) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); parent.add(m); return m;
};
const plane = (w, h, mat, parent = scene) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); parent.add(m); return m; };
/** group stuck flat on a side wall; local +z points into the hallway */
const onWall = (side, z) => {
  const g = new THREE.Group();
  g.position.set(side === 'L' ? -HX + 0.005 : HX - 0.005, 0, z);
  g.rotation.y = side === 'L' ? Math.PI / 2 : -Math.PI / 2;
  scene.add(g); return g;
};
const clickables = [];
const register = (st, ...meshes) => meshes.forEach((m) => { m.userData.station = st; clickables.push(m); });

/* ---------- hallway shell ---------- */
const floor = plane(W, L, std({ map: floorTex, roughness: 0.32 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -L / 2);
const ceil = plane(W, L, std({ map: ceilTex, roughness: 0.95 }));
ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -L / 2);
const wallMat = std({ map: wallTex, roughness: 0.85 });
const wl = plane(L, H, wallMat); wl.rotation.y = Math.PI / 2; wl.position.set(-HX, H / 2, -L / 2);
const wr = plane(L, H, wallMat); wr.rotation.y = -Math.PI / 2; wr.position.set(HX, H / 2, -L / 2);
const endTex = canvasTex(1024, 820, wallPainter, { repeat: [W / 4, 1] });
const endWall = plane(W, H, std({ map: endTex })); endWall.position.set(0, H / 2, -L);
const endWin = plane(3.4, 2.05, new THREE.MeshBasicMaterial({ map: endWindowTex, toneMapped: false, fog: false }));
endWin.position.set(0, 1.78, -L + 0.01);
const exitTex = canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = '#2b2523'; rr(g, 0, 0, w, h, 10); g.fill();
  g.shadowColor = '#ff5a4f'; g.shadowBlur = 18; text(g, 'EXIT', w / 2, h / 2 + 3, `800 60px ${F_BODY}`, '#ff6a5c');
});
const exitSign = plane(0.5, 0.19, new THREE.MeshBasicMaterial({ map: exitTex, toneMapped: false }));
exitSign.position.set(0, 3.0, -L + 0.03);

// ceiling light panels
const panelMat = new THREE.MeshBasicMaterial({ color: 0xfffaf0 });
for (let z = -2; z > -L + 1; z -= 3.5) {
  const p = plane(0.62, 1.25, panelMat); p.rotation.x = Math.PI / 2; p.position.set(0, H - 0.005, z);
}
// sunlight from the end window: shafts + glow pools on the floor
const addMat = (map, opacity) => new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
for (const [x, z, rz] of [[-0.9, -L + 2.2, 0.18], [0.7, -L + 3.4, 0.12], [0.1, -L + 5, 0.22]]) {
  const s = plane(1.3, 4.4, addMat(shaftTex, 0.16)); s.position.set(x, 1.6, z); s.rotation.z = rz;
}
for (const [x, z, sx, sz, o] of [[0, -L + 4, 3.6, 7, 0.32], [0, -15.8, 2.6, 2.2, 0.18]]) {
  const p = plane(sx, sz, addMat(glowTex, o)); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.01, z);
}

/* ---------- front: brick facade, doors, awning ---------- */
const DOOR_W = 2.0, DOOR_H = 2.4;
function notchedWall(width, height) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0); s.lineTo(-DOOR_W / 2, 0); s.lineTo(-DOOR_W / 2, DOOR_H); s.lineTo(DOOR_W / 2, DOOR_H);
  s.lineTo(DOOR_W / 2, 0); s.lineTo(width / 2, 0); s.lineTo(width / 2, height); s.lineTo(-width / 2, height); s.closePath();
  return new THREE.ShapeGeometry(s);
}
const facade = new THREE.Mesh(notchedWall(18, 7.5), std({ map: brickTex, roughness: 0.9 }));
facade.position.z = 0.03; scene.add(facade);
const innerTex = canvasTex(1024, 820, wallPainter, { repeat: [1 / 4, 1 / H] });
const inner = new THREE.Mesh(notchedWall(W, H), std({ map: innerTex }));
inner.rotation.y = Math.PI; inner.position.z = -0.03; scene.add(inner);
const trimMat = std({ color: '#FFFDF8', roughness: 0.6 });
box(DOOR_W + 0.3, 0.16, 0.12, trimMat, 0, DOOR_H + 0.08, 0.06);
box(0.15, DOOR_H, 0.12, trimMat, -DOOR_W / 2 - 0.075, DOOR_H / 2, 0.06);
box(0.15, DOOR_H, 0.12, trimMat, DOOR_W / 2 + 0.075, DOOR_H / 2, 0.06);
box(18, 0.3, 0.3, trimMat, 0, 7.5, 0.1);
box(4.2, 0.14, 1.3, std({ color: '#D9D1C4' }), 0, 0.07, 0.65);

const entranceDoorTex = canvasTex(512, 1228, (g, w, h) => {
  g.fillStyle = COLORS.green; g.fillRect(0, 0, w, h);
  g.clearRect(70, 70, w - 140, 760);
  g.fillStyle = 'rgba(210,230,232,.22)'; g.fillRect(70, 70, w - 140, 760);
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 8; g.beginPath(); g.moveTo(120, 700); g.lineTo(330, 120); g.stroke();
  text(g, 'welcome ♡', w / 2, 420, `700 72px ${F_HAND}`, 'rgba(255,253,248,.9)');
  g.fillStyle = '#C8A96A'; rr(g, 50, 900, w - 100, 34, 16); g.fill();
  g.fillStyle = '#C9C4BC'; g.fillRect(0, 1100, w, 128);
});
const doorMat = new THREE.MeshStandardMaterial({ map: entranceDoorTex, transparent: true, side: THREE.DoubleSide, roughness: 0.4 });
const hingeL = new THREE.Group(); hingeL.position.set(-DOOR_W / 2, 0, 0);
const hingeR = new THREE.Group(); hingeR.position.set(DOOR_W / 2, 0, 0);
scene.add(hingeL, hingeR);
const dl = plane(DOOR_W / 2, DOOR_H, doorMat, hingeL); dl.position.set(DOOR_W / 4, DOOR_H / 2, 0);
const dr = plane(DOOR_W / 2, DOOR_H, doorMat, hingeR); dr.position.set(-DOOR_W / 4, DOOR_H / 2, 0);
dr.scale.x = -1;

const awningTex = canvasTex(512, 256, (g, w, h) => plaid(g, 0, 0, w, h, COLORS.plaid, 64), { repeat: [2, 1] });
const awning = box(3.0, 0.06, 1.0, std({ map: awningTex, roughness: 0.9 }), 0, 2.78, 0.5);
awning.rotation.x = 0.28;
const awningEdge = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.22), std({ map: awningTex, side: THREE.DoubleSide }));
awningEdge.position.set(0, 2.56, 0.98); scene.add(awningEdge);
const schoolSign = plane(4.6, 1.0, std({ map: signPainter('SOHEEAN HIGH SCHOOL', { bg: '#FFFDF8', fg: COLORS.green, font: `800 88px ${F_BODY}`, sub: "EST. 2026  ·  HOME OF THE BUILDERS", h: 256 }), roughness: 0.6 }));
schoolSign.position.set(0, 3.75, 0.06);
const facadeWinTex = canvasTex(256, 320, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#DCEBEE'); gr.addColorStop(1, '#F6E6C8');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#FFFDF8'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14); g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h);
  g.fillRect(w / 2 - 6, 0, 12, h); g.fillRect(0, h / 2 - 6, w, 12);
});
const facadeWinMat = std({ map: facadeWinTex, roughness: 0.3 });
for (const x of [-6.2, -3.8, 3.8, 6.2]) for (const y of [1.6, 4.9]) {
  const p = plane(1.4, 1.75, facadeWinMat); p.position.set(x, y, 0.05);
}
const potMat = std({ color: '#C7765A' }); const bushMat = std({ color: '#9DB58B', roughness: 1 });
for (const x of [-2.1, 2.1]) {
  box(0.7, 0.55, 0.7, potMat, x, 0.275, 1.05);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 14), bushMat); b.position.set(x, 0.85, 1.05); scene.add(b);
}
const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff1cf });
for (const x of [-1.55, 1.55]) { box(0.18, 0.3, 0.12, lampMat, x, 2.35, 0.1); }
const ground = plane(30, 14, std({ map: pavementTex, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.001, 7);

/* ---------- lockers (left wall) ---------- */
const P = 0.46;                    // locker pitch
const LOCKER_H = 1.85, LOCKER_D = 0.5, PLINTH = 0.12;
const BANKS = [
  { from: -2.4, to: -10.4, base: COLORS.mint },
  { from: -11.0, to: -24.6, base: '#F3E7C9' },
  { from: -29.4, to: -34.4, base: '#CFDDE8' },
];
const lockerGeo = new THREE.BoxGeometry(LOCKER_D, LOCKER_H, P - 0.02);
const plinthMat = std({ color: '#6B5D53' });
const FEATURED = {
  'p-firegen': { base: COLORS.pink, kind: 'mine' },
  'p-eatwise': { num: '101', note: true, noteColor: COLORS.butter, label: ['EatWise', 'OCR ✶'] },
  'p-farm':    { num: '102', note: true, noteColor: COLORS.mint, label: ['농업 일자리', '매칭 · STT'] },
  'p-review':  { num: '103', note: true, noteColor: COLORS.pink, label: ['리뷰 →', '별점 예측 ★'] },
  'p-campus':  { num: '104', note: true, noteColor: COLORS.butter, label: ['캠퍼스', '제휴 앱'] },
};
const highlightMats = new Map();  // station → materials to glow when near
for (const bank of BANKS) {
  const sideMat = std({ color: shade(bank.base, -6), roughness: 0.5, metalness: 0.2 });
  const plainFront = std({ map: lockerPainter({ base: bank.base }), roughness: 0.45, metalness: 0.15 });
  const zs = [];
  for (let z = bank.from - P / 2; z > bank.to + P / 2; z -= P) zs.push(z);
  const len = zs.length * P;
  box(LOCKER_D, PLINTH, len, plinthMat, -HX + LOCKER_D / 2, PLINTH / 2, bank.from - len / 2);
  box(LOCKER_D + 0.02, 0.05, len, sideMat, -HX + LOCKER_D / 2, PLINTH + LOCKER_H + 0.025, bank.from - len / 2);
  const featuredHere = STATIONS.filter((s) => FEATURED[s.id] && s.z <= bank.from && s.z >= bank.to);
  const taken = new Map();
  for (const st of featuredHere) {
    let best = 0;
    zs.forEach((z, i) => { if (Math.abs(z - st.z) < Math.abs(zs[best] - st.z)) best = i; });
    st.z = zs[best];
    taken.set(best, st);
  }
  zs.forEach((z, i) => {
    const st = taken.get(i);
    let front = plainFront, side = sideMat;
    if (st) {
      const f = FEATURED[st.id];
      const base = f.base || bank.base;
      front = std({ map: lockerPainter({ base, ...f }), roughness: 0.45, metalness: 0.15, emissive: 0xfff0c0, emissiveIntensity: 0 });
      if (f.base) side = std({ color: shade(base, -6), roughness: 0.5, metalness: 0.2 });
      highlightMats.set(st, [front]);
    }
    // BoxGeometry material order: +x, -x, +y, -y, +z, -z. +x faces the hallway.
    const m = new THREE.Mesh(lockerGeo, [front, side, side, side, side, side]);
    m.position.set(-HX + LOCKER_D / 2, PLINTH + LOCKER_H / 2, z);
    scene.add(m);
    if (st) register(st, m);
  });
}
// bench between banks
const benchMat = std({ color: COLORS.wood, roughness: 0.6 });
box(0.45, 0.06, 2.4, benchMat, -HX + 0.32, 0.46, -27);
for (const dz of [-1, 1]) box(0.4, 0.44, 0.06, std({ color: '#6B5D53' }), -HX + 0.32, 0.22, -27 + dz);

/* ---------- doors, board, posters (right wall) ---------- */
function makeDoor(st, { width = 1.1, height = 2.2, tex, sign, signOpts }) {
  const g = onWall('R', st.z);
  const frame = std({ color: '#FFFDF8', roughness: 0.6 });
  box(width + 0.24, 0.12, 0.08, frame, 0, height + 0.06, 0.04, g);
  box(0.12, height, 0.08, frame, -width / 2 - 0.06, height / 2, 0.04, g);
  box(0.12, height, 0.08, frame, width / 2 + 0.06, height / 2, 0.04, g);
  const mat = std({ map: tex, roughness: 0.55, emissive: 0xfff0c0, emissiveIntensity: 0 });
  const door = plane(width, height, mat, g); door.position.set(0, height / 2, 0.02);
  const sgn = plane(Math.min(1.5, width + 0.3), 0.36, std({ map: signPainter(sign, signOpts), roughness: 0.6 }), g);
  sgn.position.set(0, height + 0.42, 0.03);
  register(st, door, sgn);
  highlightMats.set(st, [mat]);
}
makeDoor(byId.jukebox, { width: 2.0, tex: cafeDoorPainter(), sign: 'CAFETERIA', signOpts: { bg: '#3B3633', fg: '#FFD9DC', glow: '#ff8fa0', font: `800 96px ${F_BODY}` } });
makeDoor(byId.yearbook, { tex: doorPainter({ color: COLORS.butter, kind: 'yearbook' }), sign: 'YEARBOOK ROOM', signOpts: { font: `800 76px ${F_BODY}` } });
makeDoor(byId.office, { width: 1.3, tex: doorPainter({ color: COLORS.navy, kind: 'office' }), sign: 'MAIN OFFICE', signOpts: { bg: COLORS.navy, fg: '#FFFDF8', font: `800 84px ${F_BODY}` } });
// plain classroom doors for rhythm along the wall
for (const [z, c, n] of [[-9.6, COLORS.sage, '108'], [-20.6, COLORS.pink, '112'], [-31.8, COLORS.sage, '120']]) {
  const g = onWall('R', z);
  const frame = std({ color: '#FFFDF8' });
  box(1.34, 0.12, 0.08, frame, 0, 2.26, 0.04, g);
  box(0.12, 2.2, 0.08, frame, -0.61, 1.1, 0.04, g); box(0.12, 2.2, 0.08, frame, 0.61, 1.1, 0.04, g);
  const d = plane(1.1, 2.2, std({ map: doorPainter({ color: c }) }), g); d.position.set(0, 1.1, 0.02);
  const s = plane(0.5, 0.2, std({ map: signPainter(`ROOM ${n}`, { font: `800 84px ${F_BODY}` }) }), g); s.position.set(0, 2.52, 0.03);
}
{ // bulletin board
  const st = byId.about;
  const g = onWall('R', st.z);
  const mat = std({ map: bulletinPainter(), roughness: 0.9, emissive: 0xfff0c0, emissiveIntensity: 0 });
  const b = plane(2.3, 1.36, mat, g); b.position.set(0, 1.6, 0.03);
  register(st, b);
  highlightMats.set(st, [mat]);
}
const posters = [
  { side: 'R', z: -7.0, cfg: { bg: '#F7D3D6', title: ['HOMECOMING', '♡'], lines: ['Sat · Oct 17', 'Gym · 7 PM'], tapeColor: COLORS.mint, seed: 2 } },
  { side: 'R', z: -12.6, cfg: { bg: COLORS.butter, title: ['AI CLUB'], lines: ['build your first', 'LLM app ✶', 'Fri 4PM · Rm 204'], tapeColor: COLORS.pink, seed: 3 } },
  { side: 'R', z: -18.2, cfg: { plaidBg: true, title: ['SPIRIT', 'WEEK'], lines: ['Plaid Day', 'this Friday!'], tapeColor: COLORS.pink, seed: 4 } },
  { side: 'R', z: -23.6, cfg: { bg: COLORS.mint, title: ['Coffee &', 'Code ☕'], lines: ['Library', 'every Tuesday'], tapeColor: COLORS.butter, seed: 5 } },
  { side: 'R', z: -29.6, cfg: { bg: '#FFFDF8', title: ['VOTE', 'SOHEEAN ★'], titleColor: COLORS.navy, lines: ['Most Likely to', 'Build an AI'], tapeColor: COLORS.pink, seed: 6 } },
  { side: 'R', z: -38.8, cfg: { bg: '#DCE6D3', title: ['smile!'], lines: ['Yearbook photos', 'Thursday'], tapeColor: COLORS.butter, seed: 7 } },
];
for (const p of posters) {
  const g = onWall(p.side, p.z);
  const m = plane(0.62, 0.85, std({ map: posterPainter(p.cfg), roughness: 0.9 }), g);
  m.position.set(0, 1.65, 0.02); m.rotation.z = (p.z * 7) % 2 > 1 ? 0.03 : -0.03;
}
{ // above the lockers
  const g1 = onWall('L', -6.4);
  const pen = plane(1.5, 0.5, std({ map: pennantPainter('GO BUILDERS!', COLORS.navy, COLORS.butter), transparent: true }), g1);
  pen.position.set(0, 2.55, 0.01); pen.rotation.z = -0.06;
  const g2 = onWall('L', -17.8);
  const ban = plane(4.4, 0.6, std({ map: bannerPainter('★ SPIRIT WEEK · PLAID DAY FRIDAY ★') }), g2);
  ban.position.set(0, 2.6, 0.01);
  const g3 = onWall('L', -32);
  const pen2 = plane(1.5, 0.5, std({ map: pennantPainter("CLASS OF '26", COLORS.pinkD, '#FFFDF8'), transparent: true }), g3);
  pen2.position.set(0, 2.55, 0.01); pen2.rotation.z = 0.05;
}

/* ---------- floating name tags ---------- */
const TAG_W = 0.78;
for (const st of STATIONS) {
  st.tagIdle = tagPainter(st.title, st.ko, false);
  st.tagActive = tagPainter(st.title, st.ko, true);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: st.tagIdle, transparent: true, depthWrite: false }));
  spr.scale.set(TAG_W, TAG_W * 0.26, 1);
  const isDoor = ['jukebox', 'yearbook', 'office'].includes(st.id);
  spr.position.set(st.side === 'L' ? -HX + 0.62 : HX - 0.4, isDoor ? 2.98 : st.id === 'about' ? 2.55 : 2.28, st.z);
  scene.add(spr);
  st.sprite = spr;
  register(st, spr);
}

/* ==========================================================
   Camera + controls
   ========================================================== */
const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 90);
camera.rotation.order = 'YXZ';
const S = {
  mode: 'intro', z: 7.2, x: -1.4, v: 0, yaw: 0, yawT: 0, pitch: 0.1, pitchT: 0.1,
  fwd: false, back: false, turnL: false, turnR: false,
  target: null, openAt: 0, near: null, lastLook: -10, bob: 0, enterT: 0,
};
const Z_MIN = -L + 1.6, Z_MAX = -0.9, SPEED = 3.1, YAW_MAX = 1.45;

function clearInput() { S.fwd = S.back = S.turnL = S.turnR = false; S.target = null; }
const viewZ = (st) => st.z + VIEW_BACK;
const faceYaw = (st) => (st.side === 'L' ? 1 : -1) * Math.atan2(HX - 0.35, VIEW_BACK);
const playable = () => body.classList.contains('mode-game') && S.mode === 'play' && !sheet.open;

function goTo(st) {
  if (S.mode !== 'play') return;
  if (Math.abs(viewZ(st) - S.z) < 0.25) { S.yawT = faceYaw(st); S.openAt = performance.now() + 250; S.openWhat = st; return; }
  S.target = st;
}

{
  resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 80 : 68;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();
}

// intro → walk in
$('#btnEnter').addEventListener('click', () => {
  $('#intro').classList.add('leaving');
  setTimeout(() => body.classList.add('intro-done'), 450);
  S.mode = 'entering';
  S.enterT = performance.now();
  canvas.focus?.();
});

// keyboard
const K = { ArrowUp: 'fwd', w: 'fwd', W: 'fwd', ArrowDown: 'back', s: 'back', S: 'back', ArrowLeft: 'turnL', a: 'turnL', A: 'turnL', ArrowRight: 'turnR', d: 'turnR', D: 'turnR' };
addEventListener('keydown', (e) => {
  if (!playable() || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = K[e.key];
  if (k) {
    S[k] = true; S.target = null; e.preventDefault();
    if (k === 'turnL' || k === 'turnR') S.lastLook = performance.now();
  } else if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button, a, input')) {
    if (S.near) { e.preventDefault(); openSection(S.near.id); }
  }
});
addEventListener('keyup', (e) => { const k = K[e.key]; if (k) S[k] = false; });
addEventListener('blur', clearInput);

// drag to look, tap/click to open
const raycaster = new THREE.Raycaster();
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (!playable()) return;
  drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  const k = isTouch ? 0.006 : 0.0045;
  S.yawT = Math.max(-YAW_MAX, Math.min(YAW_MAX, S.yawT + dx * k));
  S.pitchT = Math.max(-0.35, Math.min(0.35, S.pitchT + dy * k * 0.8));
  S.lastLook = performance.now();
});
const endDrag = (e) => {
  if (!drag) return;
  const tap = drag.moved < 8;
  drag = null;
  if (!tap || !playable()) return;
  const r = canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = raycaster.intersectObjects(clickables, false)[0];
  const st = hit?.object.userData.station;
  if (!st) return;
  if (st === S.near) openSection(st.id); else goTo(st);
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', () => { drag = null; });

// touch buttons
function hold(el, key) {
  const on = (e) => { e.preventDefault(); if (!playable()) return; S[key] = true; S.target = null; el.classList.add('pressed'); el.setPointerCapture?.(e.pointerId); };
  const off = () => { S[key] = false; el.classList.remove('pressed'); };
  el.addEventListener('pointerdown', on);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => el.addEventListener(t, off));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
hold($('#tcFwd'), 'fwd');
hold($('#tcBack'), 'back');
tcAct.addEventListener('click', () => { if (S.near && playable()) openSection(S.near.id); });
hudPrompt.addEventListener('click', () => { if (S.near && playable()) openSection(S.near.id); });

// directory chips
const dir = $('#directory');
for (const st of STATIONS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span class="dot" style="background:${st.dot}"></span>${st.title.replace(' ★', '')}`;
  b.title = st.ko;
  b.addEventListener('click', () => goTo(st));
  st.chip = b;
  dir.append(b);
}

function setNear(st) {
  if (st === S.near) return;
  if (S.near) {
    S.near.sprite.material.map = S.near.tagIdle;
    S.near.chip.classList.remove('is-near');
  }
  S.near = st;
  if (st) {
    st.sprite.material.map = st.tagActive;
    st.chip.classList.add('is-near');
    hudPrompt.innerHTML = `<span class="hp-key">${isTouch ? 'TAP' : 'Enter ↵'}</span><span class="hp-title">${st.title}</span><span class="hp-ko">${st.ko}</span>`;
  }
  hudPrompt.hidden = !st;
  tcAct.disabled = !st;
}

/* ==========================================================
   Loop
   ========================================================== */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
let last = performance.now();
$('#loading').classList.add('done');

function frame(now) {
  requestAnimationFrame(frame);
  if (!body.classList.contains('mode-game')) { last = now; return; }
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if (S.mode === 'intro') {
    S.yawT = Math.sin(now / 3200) * 0.05;
  } else if (S.mode === 'entering') {
    const dur = reduceMotion ? 0.01 : 3.0;
    const p = clamp01((now - S.enterT) / 1000 / dur);
    const open = ease(clamp01(p / 0.45)) * 1.4;
    hingeL.rotation.y = open; hingeR.rotation.y = -open;
    const q = ease(clamp01((p - 0.12) / 0.88));
    S.z = 7.2 + (-1.6 - 7.2) * q;
    S.x = -1.4 * (1 - q);
    S.yawT = 0; S.pitchT = 0.1 * (1 - q);
    if (p >= 1) { S.mode = 'play'; S.z = -1.6; S.x = 0; }
  } else if (S.mode === 'play') {
    let dir = 0;
    if (playable()) {
      if (S.target) {
        const dz = viewZ(S.target) - S.z;
        if (Math.abs(dz) < 0.06) {
          S.yawT = faceYaw(S.target);
          S.openAt = now + 380; S.openWhat = S.target;
          S.target = null;
        } else {
          dir = Math.sign(dz) * Math.min(1, Math.abs(dz) * 1.6);
          if (Math.abs(dz) < 2.5) S.yawT += (faceYaw(S.target) - S.yawT) * Math.min(1, dt * 3);
        }
      } else {
        dir = (S.back ? 1 : 0) - (S.fwd ? 1 : 0);
      }
      if (S.turnL) S.yawT = Math.min(YAW_MAX, S.yawT + 1.7 * dt);
      if (S.turnR) S.yawT = Math.max(-YAW_MAX, S.yawT - 1.7 * dt);
      if (S.openAt && now >= S.openAt) { S.openAt = 0; openSection(S.openWhat.id); }
    }
    S.v += (dir * SPEED - S.v) * Math.min(1, dt * 7);
    S.z = Math.max(Z_MIN, Math.min(Z_MAX, S.z + S.v * dt));

    // gaze: drift back to "down the hall" while walking, unless the user is steering the view
    const idleLook = now - S.lastLook > 1400;
    if (idleLook && !S.target && Math.abs(S.v) > 1) { S.yawT *= 1 - Math.min(1, dt * 1.6); S.pitchT *= 1 - Math.min(1, dt * 1.6); }

    // nearest thing to open
    let near = null, best = 1.9;
    for (const st of STATIONS) {
      const d = Math.abs(viewZ(st) - S.z);
      if (d < best) { best = d; near = st; }
    }
    setNear(near);
  }

  // highlight pulse on whatever is near
  for (const [st, mats] of highlightMats) {
    const target = st === S.near ? 0.16 + Math.sin(now / 260) * 0.05 : 0;
    for (const m of mats) m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 8);
    const s = st === S.near ? 1.12 : 1;
    st.sprite.scale.x += (s * TAG_W - st.sprite.scale.x) * Math.min(1, dt * 10);
    st.sprite.scale.y += (s * TAG_W * 0.26 - st.sprite.scale.y) * Math.min(1, dt * 10);
  }

  S.yaw += (S.yawT - S.yaw) * Math.min(1, dt * 9);
  S.pitch += (S.pitchT - S.pitch) * Math.min(1, dt * 9);
  const walking = Math.abs(S.v) / SPEED;
  if (!reduceMotion) S.bob += dt * 9 * walking;
  camera.position.set(S.x, EYE + (reduceMotion ? 0 : Math.sin(S.bob) * 0.028 * walking), S.z);
  camera.rotation.set(S.pitch, S.yaw, reduceMotion ? 0 : Math.sin(S.bob * 0.5) * 0.004 * walking);

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
