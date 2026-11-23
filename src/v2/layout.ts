import * as THREE from 'three';
import { roadPoint } from './road';
import projects from '../content/projects.json';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const up = (p: THREE.Vector3, y: number) => p.clone().setY(y);

// ---- where things stand (plan §3) ----
export const SCHOOL = { pos: v(-22, 0, -12), rotY: 0.95 };
const schoolFront = v(Math.sin(SCHOOL.rotY), 0, Math.cos(SCHOOL.rotY));
export const HELLO_SIGN = SCHOOL.pos.clone().addScaledVector(schoolFront, 7.6).setY(12.2);
export const RIG = roadPoint(0.25, 16);
export const SYSTEM_T = projects.map((_, i) => 0.405 + i * 0.05);
export const SYSTEMS = projects.map((pr, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  return { id: pr.id, side, t: SYSTEM_T[i], pos: roadPoint(SYSTEM_T[i], side * (pr.featured ? 16 : 13)) };
});
export const SYSTEMS_SIGN = roadPoint(0.37, -9);
export const BLEACHERS = roadPoint(0.78, -18);
export const BUS_STOP = roadPoint(0.93, -8);
export const CAPTURE = { pos: v(1.2, 1.8, 16), look: v(-5, 3.2, -14), fov: 42 };
export const TREE_SKIP: [number, number][] = [[0, 0.16], [0.21, 0.3], [0.37, 0.68], [0.73, 0.83], [0.89, 0.97]];

// ---- camera keyframes: p (scroll 0..1) → pose + mode ----
export type Key = { p: number; pos: THREE.Vector3; look: THREE.Vector3; mode: string; section: string; label?: string };
const K: Key[] = [];
const add = (p: number, pos: THREE.Vector3, look: THREE.Vector3, mode: string, section: string) => K.push({ p, pos, look, mode, section });

add(0.0, CAPTURE.pos, CAPTURE.look, 'fixed', 'polaroid');
add(0.07, CAPTURE.pos, CAPTURE.look, 'fixed', 'nvs');
{ // orbit 35° to the right around the scene center → holes
  const c = v(-4, 2, -8), rel = CAPTURE.pos.clone().sub(c).applyAxisAngle(v(0, 1, 0), THREE.MathUtils.degToRad(35));
  add(0.11, c.clone().add(rel), CAPTURE.look.clone().lerp(c, 0.5), 'orbit', 'nvs');
  add(0.15, c.clone().add(rel), CAPTURE.look.clone().lerp(c, 0.5), 'orbit', 'nvs');
}
add(0.19, SCHOOL.pos.clone().addScaledVector(schoolFront, 30).setY(4.2), HELLO_SIGN.clone().setY(8.5), 'fixed', 'hello');
add(0.215, up(roadPoint(0.17), 2.7), up(roadPoint(0.215), 2.1), 'follow', 'hello');
{ // half-turn around the multi-view rig
  const toRoad = roadPoint(0.25).sub(RIG).setY(0).normalize();
  for (let i = 0; i <= 3; i++) {
    const a = (i / 3) * Math.PI * 0.95;
    const dir = toRoad.clone().applyAxisAngle(v(0, 1, 0), -a);
    add(0.255 + i * 0.035, RIG.clone().addScaledVector(dir, 10.5).setY(4.2 - i * 0.3), up(RIG, 2.0), 'orbit', 'research');
  }
}
add(0.385, up(roadPoint(0.355), 2.8), up(SYSTEMS_SIGN, 3.2), 'follow', 'systems');
SYSTEMS.forEach((s, i) => {
  const cam = up(roadPoint(s.t - 0.01, -s.side * 3.2), 3.6);
  add(0.42 + i * 0.06, cam, up(s.pos, 2.4), 'follow · pan', 'systems');
});
add(0.75, up(roadPoint(0.71), 2.8), up(roadPoint(0.76), 2), 'follow', 'stack');
add(0.8, up(roadPoint(0.765, 5), 11), up(BLEACHERS, 2), 'crane', 'stack');
add(0.845, up(roadPoint(0.775, 7), 16), up(BLEACHERS, 1), 'crane', 'stack');
add(0.905, up(roadPoint(0.875, 2.6), 3.4), up(BUS_STOP, 2.8), 'fixed', 'nextstop');
add(0.955, up(roadPoint(0.88, 2.6), 3.4), up(BUS_STOP, 2.8), 'fixed', 'nextstop');
add(1.0, BUS_STOP.clone().add(v(10, 55, 30)), BUS_STOP.clone(), 'crane', 'ending');
export const KEYS = K;

export const SECTIONS = [
  { key: 'hello', label: 'Hello', p: 0.19 },
  { key: 'research', label: 'Research', p: 0.29 },
  { key: 'systems', label: 'Systems', p: 0.42 },
  { key: 'stack', label: 'Stack', p: 0.845 },
  { key: 'nextstop', label: 'Next Stop', p: 0.93 },
];

// flying camera: road t as a function of scroll p
const FLY: [number, number][] = [[0.16, 0.135], [0.215, 0.235], [0.38, 0.27], [0.42, 0.405], [0.72, 0.68], [0.8, 0.77], [0.9, 0.915], [1, 0.95]];
export function flyT(p: number) {
  if (p <= FLY[0][0]) return FLY[0][1];
  for (let i = 0; i < FLY.length - 1; i++) {
    const [p0, t0] = FLY[i], [p1, t1] = FLY[i + 1];
    if (p <= p1) return t0 + (t1 - t0) * ((p - p0) / (p1 - p0));
  }
  return FLY[FLY.length - 1][1];
}
