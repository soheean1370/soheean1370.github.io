import * as THREE from 'three';

// One S-shaped road through campus (plan §3). Scroll 0→1 travels along it.
export const ROAD = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 14),
  new THREE.Vector3(0, 0, -6),
  new THREE.Vector3(3, 0, -26),
  new THREE.Vector3(8, 0, -44),
  new THREE.Vector3(6, 0, -62),
  new THREE.Vector3(6, 0, -92),
  new THREE.Vector3(6, 0, -122),
  new THREE.Vector3(0, 0, -142),
  new THREE.Vector3(-10, 0, -160),
  new THREE.Vector3(-12, 0, -182),
], false, 'catmullrom', 0.5);
export const ROAD_WIDTH = 6;

const tmp = new THREE.Vector3();
/** point at road parameter t, with a sideways offset (+ = right of travel) */
export function roadPoint(t: number, side = 0, out = new THREE.Vector3()) {
  ROAD.getPointAt(Math.min(1, Math.max(0, t)), out);
  if (side) {
    ROAD.getTangentAt(Math.min(1, Math.max(0, t)), tmp);
    out.x += -tmp.z * side; out.z += tmp.x * side;
  }
  return out;
}
/** yaw that faces along the road at t */
export function roadYaw(t: number) {
  ROAD.getTangentAt(Math.min(1, Math.max(0, t)), tmp);
  return Math.atan2(-tmp.x, -tmp.z);
}
/** closest road t for a world z (rough, road mostly runs along -z) */
export function tAtZ(z: number) {
  let best = 0, bd = Infinity;
  for (let i = 0; i <= 400; i++) { const t = i / 400; const p = ROAD.getPointAt(t); const d = Math.abs(p.z - z); if (d < bd) { bd = d; best = t; } }
  return best;
}
