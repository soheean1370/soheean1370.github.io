// Canvas-painted textures — no image files besides the profile photo.
import * as THREE from 'three';

export const PAL = {
  blush: '#F7D6E0', lavender: '#E2DAF5', sky: '#D6E8F7', sage: '#DCEFD6', peach: '#FFE6D2',
  cream: '#FFF8F1', cocoa: '#7A5C58', deep: '#4A3835', gold: '#D9B26F', pinkHot: '#E89BB2',
};
export const LOCKER_CYCLE = [PAL.blush, PAL.sky, PAL.sage, PAL.lavender, PAL.peach];
export const F = {
  sans: '"Pretendard Variable", Pretendard, -apple-system, sans-serif',
  serif: '"Instrument Serif", serif',
  hand: 'Caveat, Gaegu, cursive',
  mono: '"JetBrains Mono", monospace',
};

let maxAniso = 4;
export const setAniso = (n) => { maxAniso = Math.min(8, n); };

export function canvasTex(w, h, draw, { repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * (amt > 0 ? 255 - v : v))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
export const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export function speckle(g, x, y, w, h, n, alpha, r, colors) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * (0.3 + r() * 0.7);
    g.fillStyle = colors[(r() * colors.length) | 0];
    const s = 0.8 + r() * 2;
    g.fillRect(x + r() * w, y + r() * h, s, s);
  }
  g.globalAlpha = 1;
}
export function text(g, str, x, y, font, color = PAL.deep, align = 'center', maxW) {
  g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle';
  maxW ? g.fillText(str, x, y, maxW) : g.fillText(str, x, y);
}
export function tape(g, x, y, w, h, rot, color) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = 0.8; g.fillStyle = color; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
}
function shadowed(g, fn) {
  g.save(); g.shadowColor = 'rgba(74,56,53,.22)'; g.shadowBlur = 12; g.shadowOffsetY = 5; fn(); g.restore();
}
export function heart(g, x, y, s, color) {
  g.fillStyle = color; g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.4, y - s, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.4, x, y + s * 0.35);
  g.fill();
}
export function polaroidOn(g, x, y, w, rot, drawInside, caption) {
  const h = w * 1.2, p = w * 0.07, iw = w - p * 2;
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot);
  shadowed(g, () => { g.fillStyle = '#fff'; g.fillRect(-w / 2, -h / 2, w, h); });
  g.save(); g.translate(-w / 2 + p, -h / 2 + p); g.beginPath(); g.rect(0, 0, iw, iw); g.clip(); drawInside(g, iw); g.restore();
  if (caption) text(g, caption, 0, h / 2 - (h - iw - p) / 2, `700 ${Math.round(w * 0.12)}px ${F.hand}`);
  g.restore();
}
/** draw an <img> covering a box (object-fit: cover) */
export function cover(g, img, x, y, w, h, focusY = 0.3) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s, sh = h / s;
  g.drawImage(img, (img.width - sw) / 2, (img.height - sh) * focusY, sw, sh, x, y, w, h);
}
const dreamy = (top, bottom) => (g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  g.fillStyle = 'rgba(255,250,235,.9)'; g.beginPath(); g.arc(s * 0.7, s * 0.32, s * 0.1, 0, 7); g.fill();
};

/* ---------------- surfaces ---------------- */
export function floorTex(lengthRepeat) {
  return canvasTex(1024, 1024, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = '#FBF1EA'; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 18000, 0.35, r, ['#d9c6bd', '#eadbd3', '#c8b6c9', '#f3d4dc']);
    const n = 8, s = w / n, cols = [PAL.blush, PAL.lavender, PAL.sky, PAL.peach];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i * 3 + j * 5) % 9 === 0) { g.fillStyle = cols[(i + j) % 4]; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
      g.strokeStyle = 'rgba(122,92,88,.08)'; g.lineWidth = 2; g.strokeRect(i * s, j * s, s, s);
    }
  }, { repeat: [1, lengthRepeat] });
}
export function wallTex(repeatX) { // 1024 x 820 ≈ 4m x 3.2m
  return canvasTex(1024, 820, (g, w, h) => {
    const r = rng(3);
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#FFF8F1'); grd.addColorStop(1, '#FBEFE6');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const top = h - 1.0 * 256;
    g.fillStyle = '#F6E2E2'; g.fillRect(0, top, w, h - top);
    for (let x = 0; x < w; x += 256) { g.fillStyle = 'rgba(122,92,88,.08)'; g.fillRect(x + 2, top + 20, 3, h - top - 50); }
    g.fillStyle = '#E9CFC4'; g.fillRect(0, top - 10, w, 16);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, top - 8, w, 3);
    g.fillStyle = '#CDB3B0'; g.fillRect(0, h - 26, w, 26);
    speckle(g, 0, 0, w, h, 4000, 0.08, r, ['#b9a39b', '#ffffff']);
  }, { repeat: [repeatX, 1] });
}
export function ceilTex(rx, ry) {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(11);
    g.fillStyle = '#FFFAF4'; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 6000, 0.25, r, ['#d9cbc4', '#e9dfd9']);
    g.fillStyle = '#EFE2DA';
    for (let k = 0; k <= w; k += 128) { g.fillRect(k - 2, 0, 4, h); g.fillRect(0, k - 2, w, 4); }
  }, { repeat: [rx, ry] });
}
export function sunsetTex(w = 512, h = 320) {
  return canvasTex(w, h, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#D6E8F7'); gr.addColorStop(0.45, '#F7D6E0'); gr.addColorStop(0.8, '#FFD9BD'); gr.addColorStop(1, '#FFE6D2');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(w * 0.7, h * 0.72, 4, w * 0.7, h * 0.72, w * 0.45);
    sun.addColorStop(0, 'rgba(255,246,225,1)'); sun.addColorStop(1, 'rgba(255,246,225,0)');
    g.fillStyle = sun; g.fillRect(0, 0, w, h);
    const r = rng(4);
    for (let i = 0; i < 9; i++) { g.fillStyle = ['#C9DCC2', '#BFD3B8', '#D3E3CC'][i % 3]; g.beginPath(); g.arc(r() * w, h - 10 - r() * 30, 30 + r() * 40, 0, 7); g.fill(); }
    g.fillStyle = '#FFFDF9';
    g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h);
    g.fillRect(w / 2 - 5, 0, 10, h); g.fillRect(0, h * 0.4, w, 8);
  });
}
export function glowTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,226,200,1)'); gr.addColorStop(1, 'rgba(255,226,200,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}
export function windowPatchTex() { // soft window-shaped light on the floor
  return canvasTex(256, 256, (g, w, h) => {
    g.filter = 'blur(10px)';
    g.fillStyle = 'rgba(255,214,180,1)';
    g.fillRect(30, 30, 90, 196); g.fillRect(136, 30, 90, 196);
    g.filter = 'none';
  });
}

/* ---------------- lockers ---------------- */
export function lockerFrontTex({ base, num, label, sticker, gold }) {
  return canvasTex(256, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, shade(base, 18)); grd.addColorStop(0.55, base); grd.addColorStop(1, shade(base, -8));
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(122,92,88,.14)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    const vents = (y0) => { for (let k = 0; k < 4; k++) { const y = y0 + k * 24; g.fillStyle = 'rgba(122,92,88,.30)'; rr(g, 62, y, 132, 10, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(64, y + 10, 128, 3); } };
    vents(50); vents(890);
    g.fillStyle = gold ? PAL.gold : '#F4EEEA'; rr(g, 200, 470, 22, 110, 8); g.fill();
    g.fillStyle = 'rgba(122,92,88,.18)'; rr(g, 196, 466, 30, 118, 10); g.lineWidth = 2; g.stroke();
    if (num) { g.fillStyle = '#FFFDF9'; rr(g, 80, 190, 96, 40, 8); g.fill(); text(g, num, 128, 211, `600 26px ${F.mono}`); }
    if (label) {
      g.save(); g.translate(128, 330); g.rotate(-0.04);
      shadowed(g, () => { g.fillStyle = '#FFFDF9'; g.fillRect(-100, -44, 200, 88); });
      text(g, label, 0, 2, `700 ${label.length > 12 ? 30 : 40}px ${F.hand}`, PAL.deep, 'center', 186);
      g.restore();
      tape(g, 128, 286, 80, 22, 0.05, PAL.lavender);
    }
    if (sticker === 'live') {
      g.save(); g.translate(150, 640); g.rotate(0.12);
      g.fillStyle = '#E8577A'; rr(g, -56, -26, 112, 52, 10); g.fill();
      text(g, 'LIVE', 0, 2, `800 32px ${F.mono}`, '#fff');
      g.restore();
    }
    if (sticker === 'heart') heart(g, 70, 680, 26, PAL.pinkHot);
  });
}

/* My locker #1370 (double-width door) — photo, polaroids, tape, badge. Drawn in a 512x1024 space, 2x res. */
export function myLockerTex(img) {
  return canvasTex(1024, 2048, (g) => {
    g.scale(2, 2);
    const w = 512, h = 1024, base = '#CFEDE3';
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, shade(base, 18)); grd.addColorStop(0.55, base); grd.addColorStop(1, shade(base, -8));
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(122,92,88,.14)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    const vents = (y0) => { for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(122,92,88,.28)'; rr(g, 130, y0 + k * 22, 252, 10, 5); g.fill(); } };
    vents(36); vents(950);
    g.fillStyle = '#FFFDF9'; rr(g, 196, 116, 120, 40, 8); g.fill();
    text(g, '#1370', 256, 137, `700 26px ${F.mono}`);
    polaroidOn(g, 34, 190, 170, -0.08, (pg, s) => cover(pg, img, 0, 0, s, s, 0.28), 'me ♡');
    polaroidOn(g, 300, 180, 150, 0.1, dreamy('#F7D6E0', '#FFE6D2'), 'golden hour');
    tape(g, 118, 192, 80, 22, -0.4, PAL.blush); tape(g, 376, 182, 74, 20, 0.35, PAL.lavender);
    g.fillStyle = PAL.gold; rr(g, 452, 440, 24, 112, 10); g.fill();
    polaroidOn(g, 46, 630, 160, -0.06, dreamy('#D6E8F7', '#E2DAF5'), 'every angle');
    tape(g, 126, 632, 70, 20, 0.2, PAL.peach);
    g.save(); g.translate(370, 680); g.rotate(-0.08);
    g.fillStyle = PAL.lavender; g.beginPath(); g.arc(0, 0, 62, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke();
    text(g, 'PNU', 0, -16, `700 26px ${F.mono}`); text(g, 'CV LAB', 0, 16, `700 22px ${F.mono}`);
    g.restore();
    heart(g, 300, 820, 30, PAL.pinkHot); heart(g, 420, 800, 20, '#F2B8C8');
    g.save(); g.translate(256, 890); g.rotate(-0.03);
    g.fillStyle = PAL.blush; g.fillRect(-150, -30, 300, 60);
    text(g, 'Sohee was here ✿', 0, 2, `700 38px ${F.hand}`);
    g.restore();
  });
}
export function idCardTex(img) {
  return canvasTex(640, 400, (g, w, h) => {
    g.fillStyle = '#fff'; rr(g, 0, 0, w, h, 28); g.fill();
    g.save(); rr(g, 0, 0, w, 74, [28, 28, 0, 0]); g.clip(); g.fillStyle = PAL.sky; g.fillRect(0, 0, w, 74); g.restore();
    text(g, 'PUSAN NATIONAL UNIVERSITY', 32, 38, `700 24px ${F.mono}`, PAL.deep, 'left');
    g.save(); rr(g, 32, 100, 170, 220, 12); g.clip(); cover(g, img, 32, 100, 170, 220, 0.25); g.restore();
    text(g, 'Sohee An', 228, 138, `400 58px ${F.serif}`, PAL.deep, 'left');
    text(g, '@soheean1370', 230, 190, `700 38px ${F.hand}`, PAL.cocoa, 'left');
    text(g, 'B.S. Computer Science & Eng.', 230, 240, `500 24px ${F.sans}`, PAL.cocoa, 'left');
    text(g, 'Undergrad Researcher · CV Lab', 230, 276, `500 24px ${F.sans}`, PAL.cocoa, 'left');
    for (let i = 0; i < 40; i++) { g.fillStyle = PAL.deep; g.fillRect(230 + i * 9, 318, i % 3 ? 3 : 6, 46); }
    text(g, 'tap to flip ↻', w - 30, h - 24, `700 28px ${F.hand}`, PAL.pinkHot, 'right');
  });
}

/* ---------------- big props ---------------- */
export function boardTex(research) {
  return canvasTex(1600, 900, (g, w, h) => {
    const r = rng(21);
    g.fillStyle = '#D8B48C'; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 26000, 0.4, r, ['#a9825b', '#ecd0ad', '#8f6a46']);
    g.strokeStyle = '#EAD3C2'; g.lineWidth = 40; g.strokeRect(0, 0, w, h);
    const center = [w / 2, h / 2 + 10];
    const spots = [[260, 230], [w - 260, 230], [260, h - 220], [w - 260, h - 220]];
    g.strokeStyle = PAL.pinkHot; g.lineWidth = 4;
    spots.forEach(([x, y]) => { g.beginPath(); g.moveTo(center[0], center[1]); g.quadraticCurveTo((x + center[0]) / 2, (y + center[1]) / 2 + 40, x, y); g.stroke(); });
    // center card
    shadowed(g, () => { g.fillStyle = '#FFFDF9'; g.fillRect(center[0] - 300, center[1] - 120, 600, 240); });
    text(g, 'One photo → every angle', center[0], center[1] - 36, `400 64px ${F.serif}`);
    text(g, '(but still the same person)', center[0], center[1] + 40, `700 46px ${F.hand}`, PAL.cocoa);
    const cols = [PAL.sage, PAL.sky, PAL.peach, PAL.lavender];
    research.groups.forEach((gr, i) => {
      const [x, y] = spots[i];
      g.save(); g.translate(x, y); g.rotate((i % 2 ? 1 : -1) * 0.04);
      shadowed(g, () => { g.fillStyle = cols[i]; g.fillRect(-210, -140, 420, 280); });
      text(g, `${gr.id} · ${gr.kind}`, 0, -100, `600 26px ${F.mono}`, PAL.cocoa);
      text(g, gr.title, 0, -56, `700 40px ${F.hand}`, PAL.deep, 'center', 390);
      gr.papers.slice(0, 4).forEach((p, k) => text(g, `• ${p}`, -180, -6 + k * 34, `500 24px ${F.sans}`, PAL.deep, 'left', 370));
      g.restore();
      g.fillStyle = PAL.pinkHot; g.beginPath(); g.arc(x, y - 140, 13, 0, 7); g.fill();
    });
    text(g, '🌱 now learning: Diffusion · NeRF · 3DGS', w / 2, h - 50, `600 28px ${F.mono}`, PAL.deep);
  });
}
export function shelfTex(items) {
  return canvasTex(1024, 160, (g, w) => {
    const bw = Math.min(150, (w - 40) / items.length - 10);
    items.forEach((t, i) => {
      const x = 20 + i * (bw + 10) + bw / 2;
      shadowed(g, () => { g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, x - bw / 2, 30, bw, 100, 14); g.fill(); });
      g.fillStyle = LOCKER_CYCLE[i % 5]; rr(g, x - bw / 2, 30, bw, 22, [14, 14, 0, 0]); g.fill();
      text(g, t, x, 90, `600 ${t.length > 10 ? 20 : 24}px ${F.mono}`, PAL.deep, 'center', bw - 10);
    });
  });
}
export function yearbookCoverTex() {
  return canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#7C93B8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = PAL.gold; g.lineWidth = 6; g.strokeRect(30, 30, w - 60, h - 60);
    text(g, 'Class of', w / 2, 200, `400 italic 64px ${F.serif}`, '#FFF4E0');
    text(g, '2022', w / 2, 290, `400 120px ${F.serif}`, '#FFF4E0');
    text(g, 'YEARBOOK', w / 2, 420, `600 34px ${F.mono}`, PAL.gold);
  });
}
export function yearbookPagesTex(img) {
  return canvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = '#FFFDF7'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(w / 2 - 4, 0, 8, h);
    text(g, 'Class of 2022', 256, 70, `400 50px ${F.serif}`);
    for (let i = 0; i < 6; i++) {
      const x = 70 + (i % 3) * 130, y = 130 + Math.floor(i / 3) * 210;
      g.fillStyle = i === 4 ? '#fff' : ['#E9E1DC', '#E4E8EE', '#EDE5EA'][i % 3]; g.fillRect(x, y, 110, 140);
      if (i === 4) { g.fillStyle = PAL.blush; g.fillRect(x + 6, y + 6, 98, 128); text(g, '?', x + 55, y + 70, `400 60px ${F.serif}`, PAL.cocoa); }
      g.fillStyle = 'rgba(122,92,88,.4)'; g.fillRect(x + 15, y + 152, 80, 8);
    }
    text(g, 'Most Likely to Ask', 768, 150, `400 italic 46px ${F.serif}`);
    text(g, '"But What Does It Look Like', 768, 220, `700 40px ${F.hand}`);
    text(g, 'From the Other Side?"', 768, 270, `700 40px ${F.hand}`);
    text(g, 'Stay curious! — future me', 760, 420, `700 44px ${F.hand}`, PAL.pinkHot);
    text(g, 'HAGS ♡', 830, 520, `700 54px ${F.hand}`, '#7C93B8');
  });
}
export function hallPassTex() {
  return canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#FFFDF9'; rr(g, 0, 0, w, h, 24); g.fill();
    g.setLineDash([14, 10]); g.strokeStyle = PAL.cocoa; g.lineWidth = 5; rr(g, 14, 14, w - 28, h - 28, 18); g.stroke(); g.setLineDash([]);
    text(g, 'HALL PASS', w / 2, 62, `700 40px ${F.mono}`);
    const rows = [['Name', 'Sohee An'], ['Destination', 'your team'], ['Time', 'anytime']];
    rows.forEach(([k, v], i) => { text(g, k, 50, 130 + i * 56, `500 24px ${F.mono}`, PAL.cocoa, 'left'); text(g, v, 230, 128 + i * 56, `700 44px ${F.hand}`, PAL.deep, 'left'); });
  });
}
export function posterTex({ bg, title, sub, seed = 1 }) {
  return canvasTex(512, 700, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 800, 0.1, rng(seed), ['#000', '#fff']);
    title.forEach((t, i) => text(g, t, w / 2, 230 + i * 100, `400 ${t.length > 9 ? 78 : 96}px ${F.serif}`, PAL.deep, 'center', w - 60));
    sub.forEach((t, i) => text(g, t, w / 2, 470 + i * 54, `700 44px ${F.hand}`, PAL.cocoa, 'center', w - 60));
    tape(g, 70, 28, 120, 34, -0.5, 'rgba(255,255,255,.85)'); tape(g, w - 70, 28, 120, 34, 0.5, 'rgba(255,255,255,.85)');
  });
}
export function doorTex() {
  return canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = '#EFE4F0'; g.fillRect(0, 0, w, h);
    const gl = g.createLinearGradient(0, 80, 0, 640);
    gl.addColorStop(0, '#F7D6E0'); gl.addColorStop(0.6, '#FFD9BD'); gl.addColorStop(1, '#FFE6D2');
    g.fillStyle = gl; g.fillRect(70, 80, w - 140, 560);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 8; g.beginPath(); g.moveTo(120, 560); g.lineTo(320, 120); g.stroke();
    g.fillStyle = PAL.gold; rr(g, 50, 700, w - 100, 30, 15); g.fill();
    g.fillStyle = '#DCCFD9'; g.fillRect(0, 900, w, 124);
  });
}
