import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHallway, addLights } from './world/hallway.js';
import { setAniso } from './world/textures.js';
import profile from './content/profile.json';
import projects from './content/projects.json';
import research from './content/research.json';
import toolkit from './content/toolkit.json';
import timeline from './content/timeline.json';
import copy from './content/copy.json';

const content = { profile, projects, research, toolkit, timeline, copy };
const params = new URLSearchParams(location.search);
const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;

// ---------- WebGL check → flat version ----------
const canvas = document.getElementById('scene');
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
const fontSample = 'Sohee An soheean1370 #1370 One photo every angle HALL PASS Class of 2022 ♡✿★ 0123456789';
await Promise.race([
  Promise.all(['400 40px "Instrument Serif"', '700 40px Caveat', '600 40px "JetBrains Mono"', '600 40px "Pretendard Variable"']
    .map((f) => document.fonts.load(f, fontSample))),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});
const profileImg = await loadImg(profile.photo);

// ---------- scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color('#FFF8F1');
scene.fog = new THREE.Fog('#F6DCD6', 16, 46);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.3;
addLights(scene);
const { world, interactables } = buildHallway({ profileImg, content, isMobile });
scene.add(world);

const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 80);
camera.position.set(0, 1.6, 2);
camera.lookAt(0, 1.6, -10);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.8 ? 75 : 60;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let controls;
if (params.has('debug')) {
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.6, -10);
  controls.update();
  window.__app = { camera, controls, scene };
}

document.getElementById('loader')?.classList.add('done');
renderer.setAnimationLoop(() => {
  controls?.update();
  renderer.render(scene, camera);
});

export { renderer, scene, camera, world, interactables, content };
