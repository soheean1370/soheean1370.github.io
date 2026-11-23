import * as THREE from 'three';
import Lenis from 'lenis';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHallway, addLights } from './world/hallway.js';
import { setAniso } from './world/textures.js';
import { createNVS, patchReveal, reveal } from './nvs/nvs.js';
import { STATIONS, SNAP_KEYS, TITLES, sample, stationP } from './core/rail.js';
import { startClock, createFilm, createPanels, objectButtons } from './ui/ui.js';
import profile from './content/profile.json';
import projects from './content/projects.json';
import research from './content/research.json';
import toolkit from './content/toolkit.json';
import timeline from './content/timeline.json';
import copy from './content/copy.json';

const content = { profile, projects, research, toolkit, timeline, copy };
const params = new URLSearchParams(location.search);
const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);

// ---------- loader (3s → offer the flat version) ----------
const pct = $('loaderPct');
const setPct = (n) => { pct.textContent = `현상 중… ${n}%`; };
setTimeout(() => $('loaderSkip').classList.add('show'), 3000);
setPct(5);

// ---------- WebGL check → flat version ----------
const canvas = $('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch {
  location.replace('/flat.html');
  throw new Error('no webgl');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
setAniso(renderer.capabilities.getMaxAnisotropy());

// ---------- fonts + photo before painting textures ----------
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const fontSample = JSON.stringify(content) + '안소희 사진 한 장 모든 각도 그래도 같은 사람으로 지금 공부 중 부산대학교 정보컴퓨터공학부 학부연구생 눌러서 열기 이름 목적지 당신의 팀 시간 언제든지 복도 통행증 소희 다녀감 나 노을 모든 각도 ♡✿★↻ 0123456789';
await Promise.race([
  Promise.all(['400 40px "Instrument Serif"', '700 40px Caveat', '700 40px Gaegu', '700 40px "Gowun Batang"', '600 40px "JetBrains Mono"', '600 40px "Pretendard Variable"', '800 40px "Pretendard Variable"']
    .map((f) => document.fonts.load(f, fontSample))),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});
setPct(30);
const profileImg = await loadImg(profile.photo);
setPct(45);

// ---------- scene ----------
const CREAM = new THREE.Color('#FFF8F1'), DARK = new THREE.Color('#4A3835');
const scene = new THREE.Scene();
scene.background = CREAM.clone();
scene.fog = new THREE.Fog('#F6DCD6', 16, 46);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.3;
addLights(scene);
const { world, interactables } = buildHallway({ profileImg, content, isMobile });
scene.add(world);
patchReveal(world);
setPct(70);

const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 80);
camera.rotation.order = 'YXZ';
const nvs = createNVS({ renderer, scene, world, pose: { position: STATIONS[0].pos, quaternion: STATIONS[0].quat }, isMobile });
renderer.compile(scene, camera);
nvs.capture();
setPct(100);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.8 ? 75 : 60;
  camera.updateProjectionMatrix();
  nvs.setPointPx(renderer.getDrawingBufferSize(new THREE.Vector2()).y, camera.fov);
}
addEventListener('resize', resize);
resize();
$('endingPhoto').src = nvs.snapshot(resize);
if (isMobile) $('tryHint').textContent = '사진을 손가락으로 문질러 보세요 ✿';

// ---------- scroll ----------
const lenis = new Lenis({ lerp: reduceMotion ? 1 : 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
let progress = 0, lastScrollAt = 0, snapping = false;
lenis.on('scroll', (l) => { progress = l.progress || 0; lastScrollAt = performance.now(); });
const goTo = (p, duration = 1.8) => lenis.scrollTo(p * lenis.limit, { duration: reduceMotion ? 0 : duration });

document.querySelectorAll('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  const k = a.dataset.goto;
  goTo(k === '0' ? 0 : stationP(k));
}));
const snapPs = SNAP_KEYS.map(stationP);
addEventListener('keydown', (e) => {
  if (panels.isOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
  const i = snapPs.findIndex((p) => p > progress + 0.005);
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(i < 0 ? 1 : snapPs[i]); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    const prev = [...snapPs].reverse().find((p) => p < progress - 0.005);
    goTo(prev ?? 0);
  } else if (/^[1-8]$/.test(e.key)) {
    const keys = ['photo', 'front', 'side', 'lockers', 'toolkit', 'back', 'turn', 'hallpass'];
    goTo(stationP(keys[+e.key - 1]));
  } else if (e.key === 'v' || e.key === 'V') {
    vMode = !vMode;
  }
});

// ---------- panels + picking ----------
const panels = createPanels(content, { onOpen: () => lenis.stop(), onClose: () => lenis.start() });
objectButtons(interactables, panels.open);
const pickables = interactables.flatMap((it) => it.meshes);
const byId = Object.fromEntries(interactables.map((it) => [it.id, it]));
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2(9, 9);
let hovered = null, downAt = null;
const tip = $('hoverTip');
const pick = () => {
  if (reveal.value < 0.99 || vMode) return null;
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(pickables, false)[0];
  return hit && hit.distance < 9 ? byId[hit.object.userData.interactable] : null;
};
const mouse = { x: 0, y: 0, moved: false };
addEventListener('pointermove', (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  mouse.x = ndc.x; mouse.y = ndc.y; mouse.moved = true;
  tip.style.left = `${e.clientX}px`; tip.style.top = `${e.clientY}px`;
});
canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  const it = pick();
  if (it) panels.open(it.panel);
});

// ---------- HUD ----------
startClock();
const film = createFilm(8);
const stageEl = $('stage'), centerEl = $('centerText'), sceneEl = $('sceneName');
const STAGES = [
  [0.0, 0.04, '① 입력: 사진 한 장'],
  [0.04, 0.08, '② 깊이 추정 → 3D 점으로 들어올리기'],
  [0.08, 0.13, '③ 새로운 시점 → 카메라가 못 본 구멍'],
  [0.13, 0.19, '④ 못 본 곳 채우기 → 복도 완성'],
];
let lastStage = '', lastScene = '';

// ---------- loop ----------
const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
const par = new THREE.Euler(0, 0, 0, 'YXZ'), parQ = new THREE.Quaternion();
const look = { x: 0, y: 0 };
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let vMode = false, vMix = 0, last = performance.now();
const um = new THREE.Vector2(9, 9);
const titleEl = $('stationTitle'), endingEl = $('ending');
let lastTitle = '';
$('againBtn').addEventListener('click', () => goTo(0, 3));

$('loader').classList.add('done');

renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  lenis.raf(now);
  const p = progress;

  // snap gently onto the nearest station once scrolling settles
  if (!snapping && !panels.isOpen() && now - lastScrollAt > 260 && now - lastScrollAt < 400) {
    const near = snapPs.reduce((a, b) => (Math.abs(b - p) < Math.abs(a - p) ? b : a));
    if (Math.abs(near - p) > 0.002 && Math.abs(near - p) < 0.022 && p > 0.19) { snapping = true; goTo(near, 0.6); setTimeout(() => { snapping = false; }, 700); }
  }

  // camera on the rail + a little mouse parallax (±8°) + walking bob
  const st = sample(p, pos, quat);
  if (!isMobile && !reduceMotion) { look.x += (mouse.x - look.x) * Math.min(1, dt * 3); look.y += (mouse.y - look.y) * Math.min(1, dt * 3); }
  par.set(look.y * 0.08, -look.x * 0.14, 0); parQ.setFromEuler(par);
  camera.position.copy(pos);
  if (!reduceMotion) camera.position.y += Math.sin(now / 180) * Math.min(0.02, Math.abs(lenis.velocity) * 0.0006);
  camera.quaternion.copy(quat).multiply(parQ);

  // ----- Scene 0 → 1: photo → points → holes → fill -----
  vMix += ((vMode ? 1 : 0) - vMix) * Math.min(1, dt * 5);
  const toFull = ss(0.0, 0.04, p);                       // polaroid grows to fill the view
  const lift = ss(0.045, 0.08, p);                       // pixels lift to their depth
  const fill = ss(0.135, 0.18, p);                       // real hallway dissolves in
  const dark = Math.max(ss(0.035, 0.09, p) * (1 - ss(0.15, 0.185, p)), vMix);
  scene.background.copy(CREAM).lerp(DARK, dark);
  document.body.classList.toggle('on-dark', dark > 0.5);

  nvs.polaroid.visible = p < 0.05;
  const s = 0.47 + 0.53 * toFull;
  nvs.polaroid.scale.setScalar(s);
  nvs.polaroid.position.copy(nvs.home).addScaledVector(nvs.down, (1 - toFull) * 0.04);
  nvs.polaroid.quaternion.copy(STATIONS[0].quat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(
    (1 - toFull) * look.y * 0.1, (1 - toFull) * look.x * 0.1, (1 - toFull) * -0.05)));
  nvs.frameMat.opacity = 1 - toFull;
  nvs.photo.visible = false;          // the photo *is* the points, so it can react to the cursor
  nvs.syncFlat();
  if (mouse.moved) um.lerp(new THREE.Vector2(mouse.x, mouse.y), Math.min(1, dt * 12));
  nvs.uniforms.uMouse.value.copy(um);
  nvs.uniforms.uAspect.value = camera.aspect;
  nvs.uniforms.uRepel.value = reduceMotion ? 0 : 1;
  nvs.uniforms.uScatter.value = reduceMotion ? 0 : 1;

  const pointsOn = p < 0.19 || vMix > 0.01;
  nvs.points.visible = pointsOn;
  nvs.uniforms.uLift.value = vMix > 0.01 ? 1 : lift;
  nvs.uniforms.uEdge.value = Math.max(ss(0.085, 0.12, p), vMix);
  nvs.uniforms.uAlpha.value = vMix > 0.01 ? vMix : 1 - ss(0.15, 0.185, p);
  reveal.value = fill * (1 - vMix);
  if (p < 0.045 && vMix < 0.01) reveal.value = 0;
  nvs.frustum.visible = p > 0.17 || vMix > 0.01;

  // HUD
  $('intro').style.opacity = String(1 - ss(0.0, 0.02, p));
  $('scrollHint').style.opacity = String(1 - ss(0.0, 0.015, p));
  const stage = vMode ? '시점 합성 모드 · V를 다시 누르면 돌아가요' : (STAGES.find(([a, b]) => p >= a && p < b)?.[2] ?? '');
  if (stage !== lastStage) { stageEl.textContent = stage; stageEl.classList.toggle('show', !!stage && (p > 0.005 || vMode)); lastStage = stage; }
  if (p > 0.005 && !stageEl.classList.contains('show') && stage) stageEl.classList.add('show');
  centerEl.classList.toggle('show', p > 0.185 && p < 0.225);
  if (!centerEl.textContent) centerEl.textContent = copy.ko.sceneOneEnd;
  const sceneName = p < 0.19 ? '' : st.name;
  if (sceneName !== lastScene) { sceneEl.textContent = sceneName; lastScene = sceneName; }
  film(p);

  // big station title
  const near = p > 0.2 && p < 0.965 ? STATIONS.find((x) => TITLES[x.key] && Math.abs(x.p - p) < 0.02) : null;
  const tkey = near && !panels.isOpen() ? near.key : '';
  if (tkey !== lastTitle) {
    lastTitle = tkey;
    titleEl.classList.remove('show');
    if (tkey) {
      const t = TITLES[tkey];
      $('stKicker').textContent = t.kicker; $('stTitle').textContent = t.title; $('stSub').textContent = t.sub;
      requestAnimationFrame(() => titleEl.classList.add('show'));
    }
  }

  // ending: light floods in, then everything folds back into one polaroid
  const flash = ss(0.962, 0.99, p);
  endingEl.style.setProperty('--flash', String(flash));
  endingEl.classList.toggle('on', flash > 0.01);
  endingEl.classList.toggle('done', p > 0.988);
  endingEl.setAttribute('aria-hidden', String(p <= 0.988));
  $('hud').style.opacity = String(1 - flash);
  document.querySelectorAll('.bar-views a').forEach((a) => a.classList.toggle('is-active', a.dataset.goto === st.chip));

  // hover highlight (desktop)
  const h = !isMobile && !panels.isOpen() ? pick() : null;
  if (h !== hovered) {
    hovered = h;
    canvas.style.cursor = h ? 'pointer' : '';
    tip.hidden = !h;
    if (h) tip.textContent = `✿ 열기 · ${h.label}`;
  }
  for (const it of interactables) {
    const target = it === hovered ? 0.35 : 0;
    for (const m of it.mats) m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 10);
  }

  renderer.render(scene, camera);
});

if (params.has('debug')) window.__app = { camera, scene, nvs, lenis, goTo };
