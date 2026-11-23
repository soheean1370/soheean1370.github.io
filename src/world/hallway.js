// The hallway: shell, light, lockers and the props each scene points at.
import * as THREE from 'three';
import * as T from './textures.js';

export const HALL = { W: 4.4, H: 3.2, Z0: 3.5, Z1: -36 };
const HX = HALL.W / 2;
const L = HALL.Z0 - HALL.Z1;
const ZC = (HALL.Z0 + HALL.Z1) / 2;

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.7, ...o });
const plane = (w, h, mat, parent) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); parent.add(m); return m; };
const box = (w, h, d, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
/** group flat against a side wall at world z; local +z points into the hallway, local +y up */
function onWall(parent, side, z) {
  const g = new THREE.Group();
  g.position.set(side === 'L' ? -HX : HX, 0, z);
  g.rotation.y = side === 'L' ? Math.PI / 2 : -Math.PI / 2;
  parent.add(g); return g;
}

export function buildHallway({ profileImg, content, isMobile }) {
  const world = new THREE.Group();
  const interactables = [];   // { id, panel, label, meshes, mats, anchor }
  const add = (id, panel, label, meshes, mats, anchor) => {
    meshes.forEach((m) => { m.userData.interactable = id; });
    interactables.push({ id, panel, label, meshes, mats, anchor });
  };

  /* ---------- shell ---------- */
  const floor = plane(HALL.W, L, std({ map: T.floorTex(L / HALL.W), roughness: 0.22, metalness: 0.05 }), world);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, ZC);
  const ceil = plane(HALL.W, L, std({ map: T.ceilTex(HALL.W / 2.4, L / 2.4), roughness: 0.95 }), world);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HALL.H, ZC);
  const wallMat = std({ map: T.wallTex(L / 4), roughness: 0.85 });
  const wl = plane(L, HALL.H, wallMat, world); wl.rotation.y = Math.PI / 2; wl.position.set(-HX, HALL.H / 2, ZC);
  const wr = plane(L, HALL.H, wallMat, world); wr.rotation.y = -Math.PI / 2; wr.position.set(HX, HALL.H / 2, ZC);
  const endMat = std({ map: T.wallTex(HALL.W / 4), roughness: 0.85 });
  const front = plane(HALL.W, HALL.H, endMat, world); front.position.set(0, HALL.H / 2, HALL.Z1);
  const back = plane(HALL.W, HALL.H, endMat, world); back.position.set(0, HALL.H / 2, HALL.Z0); back.rotation.y = Math.PI;

  // doors at both ends (glass shows the sunset)
  const doorTex = T.doorTex();
  const doorMat = std({ map: doorTex, emissive: 0xffffff, emissiveMap: doorTex, emissiveIntensity: 0.35, roughness: 0.4 });
  for (const [z, rot] of [[HALL.Z1 + 0.01, 0], [HALL.Z0 - 0.01, Math.PI]]) {
    const g = new THREE.Group(); g.position.set(0, 0, z); g.rotation.y = rot; world.add(g);
    for (const x of [-0.5, 0.5]) { const d = plane(1.0, 2.4, doorMat, g); d.position.set(x, 1.2, 0.01); if (x > 0) d.scale.x = -1; }
    box(2.2, 0.12, 0.08, std({ color: '#FFFDF9' }), g, 0, 2.46, 0.04);
  }

  /* ---------- windows (right wall, upper row) + light ---------- */
  const sunTex = T.sunsetTex();
  const winMat = new THREE.MeshBasicMaterial({ map: sunTex, toneMapped: false, fog: false });
  const patchTex = T.windowPatchTex();
  const patchMat = new THREE.MeshBasicMaterial({ map: patchTex, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  for (const z of [1.2, -2.8, -10.6, -14.2, -17.8, -21.0, -27.8, -31.4]) {
    const g = onWall(world, 'R', z);
    const win = plane(1.7, 0.95, winMat, g); win.position.set(0, 2.5, 0.01);
    box(1.85, 0.06, 0.12, std({ color: '#FFFDF9' }), g, 0, 2.0, 0.06);
    // sun comes in from the upper right and lands on the floor toward the left
    const p = plane(1.9, 1.3, patchMat, world);
    p.rotation.x = -Math.PI / 2; p.rotation.z = 0.35; p.position.set(-0.2, 0.012, z - 0.9);
  }

  /* ---------- pendant lights ---------- */
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff1df });
  const cordMat = std({ color: '#CDB3B0' });
  [1, -5.5, -12, -18.5, -25, -31.5].forEach((z, i) => {
    box(0.015, 0.55, 0.015, cordMat, world, 0, HALL.H - 0.275, z);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), bulbMat); s.position.set(0, HALL.H - 0.7, z); world.add(s);
    if (i % 2 === 0 || !isMobile) {
      const l = new THREE.PointLight(0xffe7d0, 3.2, 9, 1.4); l.position.set(0, HALL.H - 0.85, z); world.add(l);
    }
  });

  /* ---------- lockers (left wall) ---------- */
  const P = 0.46, LH = 1.85, LD = 0.5, PL = 0.12;
  const sideMats = T.LOCKER_CYCLE.map((c) => std({ color: c, roughness: 0.55, metalness: 0.1 }));
  const plainFront = T.LOCKER_CYCLE.map((c) => std({ map: T.lockerFrontTex({ base: c }), roughness: 0.5, metalness: 0.1 }));
  const plinthMat = std({ color: '#CDB3B0' });
  const projects = content.projects;
  const PROJECT_SLOTS = { eatwise: -12.4, farmforyou: -14.2, firegenerators: -16.3, 'review-stars': -18.6, withpnu: -20.5, qroom: -22.4 };
  const SPECIAL = { mylocker: -4.0 };
  const banks = [[1.8, -6.6], [-10.8, -24.0], [-26.2, -33.8]];
  let idx = 0;

  function locker(z, width, frontMat, colorI, parentId) {
    const g = onWall(world, 'L', z);
    const body = box(width - 0.02, LH, LD, sideMats[colorI % 5], g, 0, PL + LH / 2, LD / 2);
    const door = plane(width - 0.04, LH - 0.02, frontMat, g); door.position.set(0, PL + LH / 2, LD + 0.004);
    box(width, PL, LD, plinthMat, g, 0, PL / 2, LD / 2);
    return { g, body, door };
  }

  for (const [from, to] of banks) {
    const slots = [];
    for (let z = from - P / 2; z > to + P / 2; z -= P) slots.push(z);
    box(from - to, 0.05, LD + 0.02, sideMats[2], onWall(world, 'L', (from + to) / 2), 0, PL + LH + 0.025, LD / 2);
    // claim slots for special lockers (double-width ones take two)
    const claims = new Map();
    const claim = (key, targetZ, span) => {
      let best = -1;
      slots.forEach((z, i) => { if (i + span <= slots.length && (best < 0 || Math.abs(z - targetZ) < Math.abs(slots[best] - targetZ))) best = i; });
      if (best >= 0 && Math.abs(slots[best] - targetZ) < 1.2) for (let k = 0; k < span; k++) claims.set(best + k, k === 0 ? { key, span } : 'skip');
    };
    for (const [k, z] of Object.entries(SPECIAL)) claim(k, z, 2);
    for (const [k, z] of Object.entries(PROJECT_SLOTS)) claim(k, z, k === 'firegenerators' ? 2 : 1);

    slots.forEach((z, i) => {
      const c = claims.get(i);
      if (c === 'skip') return;
      if (!c) { locker(z, P, plainFront[idx % 5], idx); idx++; return; }
      const zc = c.span === 2 ? z - P / 2 : z;
      if (c.key === 'mylocker') {
        const front = std({ map: T.myLockerTex(profileImg), roughness: 0.5, emissive: 0xf7a8c0, emissiveIntensity: 0 });
        const { g, door } = locker(zc, P * 2, front, 2);
        const idMat = std({ map: T.idCardTex(profileImg), roughness: 0.35, emissive: 0xf7a8c0, emissiveIntensity: 0 });
        const card = plane(0.4, 0.25, idMat, g); card.position.set(-0.16, 1.08, LD + 0.012); card.rotation.z = 0.04;
        add('idcard', 'about', 'Student ID', [card], [idMat], card);
        add('mylocker', 'about', 'My locker #1370', [door], [front], door);
        return;
      }
      const pr = projects.find((x) => x.id === c.key);
      if (c.key === 'firegenerators') {
        const width = P * 2;
        const front = std({ map: T.lockerFrontTex({ base: '#FFF3E4', num: '★', label: 'FireGenerators', gold: true }), roughness: 0.45, emissive: 0xf7a8c0, emissiveIntensity: 0 });
        const { g, door } = locker(zc, width, std({ color: '#5a4642' }), 4);
        // door hangs slightly open, warm light spilling out
        g.remove(door);
        const hinge = new THREE.Group(); hinge.position.set(-width / 2 + 0.02, 0, LD + 0.004); g.add(hinge);
        const d = plane(width - 0.04, LH - 0.02, front, hinge); d.position.set((width - 0.04) / 2, PL + LH / 2, 0);
        hinge.rotation.y = -0.6;
        const glow = plane(width - 0.08, LH - 0.1, new THREE.MeshBasicMaterial({ color: 0xffd9bd, toneMapped: false }), g);
        glow.position.set(0, PL + LH / 2, 0.06);
        const l = new THREE.PointLight(0xffc9a6, 2.2, 3.2, 1.5); l.position.set(0, 1.3, LD + 0.25); g.add(l);
        add('firegenerators', 'featured', 'FireGenerators ★', [d, glow], [front], d);
        return;
      }
      const ci = idx++;
      const front = std({
        map: T.lockerFrontTex({ base: T.LOCKER_CYCLE[ci % 5], num: String(1380 + Object.keys(PROJECT_SLOTS).indexOf(c.key)), label: pr.title, sticker: pr.live ? 'live' : 'heart' }),
        roughness: 0.5, emissive: 0xf7a8c0, emissiveIntensity: 0,
      });
      const { door } = locker(zc, P, front, ci);
      add(pr.id, `project:${pr.id}`, pr.title, [door], [front], door);
    });
  }

  /* ---------- research board (right wall) ---------- */
  {
    const g = onWall(world, 'R', -7);
    const mat = std({ map: T.boardTex(content.research), roughness: 0.9, emissive: 0xf7a8c0, emissiveIntensity: 0 });
    const b = plane(2.7, 1.52, mat, g); b.position.set(0, 1.42, 0.03);
    add('board', 'research', 'Research board', [b], [mat], b);
  }

  /* ---------- trophy case (right wall) = toolkit ---------- */
  {
    const g = onWall(world, 'R', -24);
    const frame = std({ color: '#FFFDF9', roughness: 0.5 });
    const back = plane(2.2, 1.9, std({ color: '#EEE6F7', roughness: 0.9 }), g); back.position.set(0, 1.2, 0.02);
    box(2.3, 0.08, 0.45, frame, g, 0, 0.25, 0.22); box(2.3, 0.08, 0.45, frame, g, 0, 2.17, 0.22);
    box(0.06, 1.95, 0.45, frame, g, -1.12, 1.2, 0.22); box(0.06, 1.95, 0.45, frame, g, 1.12, 1.2, 0.22);
    const mats = [];
    content.toolkit.shelves.forEach((s, i) => {
      const y = 1.72 - i * 0.55;
      box(2.18, 0.025, 0.4, std({ color: '#ffffff', transparent: true, opacity: 0.5, roughness: 0.1 }), g, 0, y - 0.17, 0.22);
      const m = std({ map: T.shelfTex(s.items), transparent: true, roughness: 0.6, emissive: 0xf7a8c0, emissiveIntensity: 0 });
      mats.push(m);
      const p = plane(2.1, 0.33, m, g); p.position.set(0, y, 0.2);
    });
    const gold = std({ color: T.PAL.gold, metalness: 0.8, roughness: 0.25 });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.06, 0.22, 24), gold); cup.position.set(0, 2.45, 0.22); g.add(cup);
    box(0.16, 0.06, 0.16, gold, g, 0, 2.24, 0.22);
    const glass = plane(2.2, 1.9, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0 }), g);
    glass.position.set(0, 1.2, 0.45);
    add('trophy', 'toolkit', 'Trophy case · toolkit', [glass, cup], mats, glass);
  }

  /* ---------- yearbook on the floor = back view ---------- */
  {
    const g = new THREE.Group(); g.position.set(0.35, 0, -28); g.rotation.y = 0.25; world.add(g);
    box(1.1, 0.04, 0.66, std({ map: T.yearbookCoverTex(), roughness: 0.6 }), g, 0, 0.02, 0);
    const pm = std({ map: T.yearbookPagesTex(profileImg), roughness: 0.8, emissive: 0xf7a8c0, emissiveIntensity: 0 });
    const pages = plane(1.04, 0.62, pm, g); pages.rotation.x = -Math.PI / 2; pages.position.y = 0.045;
    add('yearbook', 'yearbook', 'Yearbook', [pages], [pm], pages);
  }

  /* ---------- hall pass next to the front door ---------- */
  {
    const m = std({ map: T.hallPassTex(), roughness: 0.6, emissive: 0xf7a8c0, emissiveIntensity: 0 });
    const hp = plane(0.8, 0.5, m, world); hp.position.set(1.5, 1.45, HALL.Z1 + 0.03); hp.rotation.z = -0.05;
    add('hallpass', 'hallpass', 'Hall pass', [hp], [m], hp);
  }

  /* ---------- posters ---------- */
  [
    { z: -10.0, cfg: { bg: T.PAL.blush, title: ['Spirit Week'], sub: ['pastel day ✿', 'this Friday'], seed: 2 } },
    { z: -19.4, cfg: { bg: T.PAL.sky, title: ['Homecoming'], sub: ['Sat · 7 PM', 'in the gym ♡'], seed: 3 } },
    { z: -31.0, cfg: { bg: T.PAL.sage, title: ['Photo Club'], sub: ['every angle', 'counts'], seed: 4 } },
  ].forEach(({ z, cfg }) => {
    const g = onWall(world, 'R', z);
    const p = plane(0.6, 0.82, std({ map: T.posterTex(cfg), roughness: 0.9 }), g); p.position.set(0, 1.35, 0.02); p.rotation.z = 0.02;
  });

  return { world, interactables };
}

export function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xd6e8f7, 0xc9b8e8, 0.55));
  const sun = new THREE.DirectionalLight(0xffc9a0, 1.4);
  sun.position.set(10, 7, -8); sun.target.position.set(-2, 0, -14);
  scene.add(sun, sun.target);
}
