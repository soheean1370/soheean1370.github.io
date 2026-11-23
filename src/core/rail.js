// Camera rail: stations (plan §6-2) joined by a Catmull-Rom path.
// Between two stations the motion is eased, so the camera naturally lingers at each one.
import * as THREE from 'three';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
export const STATIONS = [
  { key: 'photo',   p: 0.00, pos: v(0, 1.6, 2),       look: v(0, 1.6, -10),    name: 'one photo' },
  { key: 'lift',    p: 0.08, pos: v(0, 1.6, 2),       look: v(0, 1.6, -10),    name: 'one photo → points' },
  { key: 'nvs',     p: 0.13, pos: v(1.6, 1.4, -1),    look: v(0, 1.5, -8),     name: 'a viewpoint the camera never had' },
  { key: 'fill',    p: 0.18, pos: v(1.5, 1.45, -1.4), look: v(0, 1.5, -8),     name: 'fill the unseen' },
  { key: 'front',   p: 0.25, pos: v(-0.45, 1.5, -2.7), look: v(-2.2, 1.25, -4.1), name: 'front view · my locker #1370', chip: 'front' },
  { key: 'side',    p: 0.35, pos: v(0.2, 1.55, -5.6), look: v(2.2, 1.4, -7),    name: 'side view · research', chip: 'side' },
  { key: 'lockers', p: 0.45, pos: v(0, 1.6, -11),     look: v(-2.2, 1.3, -13.6), name: 'lockers · projects', chip: 'lockers' },
  { key: 'featured',p: 0.53, pos: v(-0.2, 1.5, -14.4), look: v(-2.2, 1.2, -16.6), name: 'lockers · featured: FireGenerators' },
  { key: 'more',    p: 0.61, pos: v(0, 1.6, -18.6),   look: v(-2.2, 1.3, -21.6), name: 'lockers · more projects' },
  { key: 'toolkit', p: 0.70, pos: v(0.3, 1.45, -22.6), look: v(2.2, 1.25, -24),  name: 'toolkit · trophy case', chip: 'toolkit' },
  { key: 'back',    p: 0.79, pos: v(0.1, 2.45, -29.5), look: v(0.35, 0, -28.05), name: 'back view · yearbook', chip: 'back' },
  { key: 'turn',    p: 0.86, pos: v(0, 1.7, -30.6),   look: v(0, 1.5, 0),       name: 'back view · the way we came' },
  { key: 'hallpass',p: 0.96, pos: v(0.35, 1.55, -33.4), look: v(1.0, 1.45, -36),   name: 'hall pass · say hi', chip: 'hallpass' },
  { key: 'end',     p: 1.00, pos: v(0.4, 1.55, -33.7), look: v(1.1, 1.45, -36),   name: 'hall pass · say hi' },
];
export const SNAP_KEYS = ['photo', 'front', 'side', 'lockers', 'featured', 'more', 'toolkit', 'back', 'turn', 'hallpass'];

const m = new THREE.Matrix4();
const up = v(0, 1, 0);
STATIONS.forEach((s) => { s.quat = new THREE.Quaternion().setFromRotationMatrix(m.lookAt(s.pos, s.look, up)); });
const curve = new THREE.CatmullRomCurve3(STATIONS.map((s) => s.pos), false, 'catmullrom', 0.35);

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** p in [0,1] → { position, quaternion, station (nearest), seg } */
export function sample(p, outPos, outQuat) {
  p = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < STATIONS.length - 2 && p > STATIONS[i + 1].p) i++;
  const a = STATIONS[i], b = STATIONS[i + 1];
  const t = (p - a.p) / Math.max(1e-6, b.p - a.p);
  const e = smoother(Math.min(1, Math.max(0, t)));
  curve.getPoint((i + e) / (STATIONS.length - 1), outPos);
  outQuat.slerpQuaternions(a.quat, b.quat, e);
  return e < 0.5 ? a : b;
}
export const stationP = (key) => STATIONS.find((s) => s.key === key || s.chip === key)?.p ?? 0;
