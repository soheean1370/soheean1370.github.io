import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { KEYS, SYSTEMS } from '../layout';
import { live, useStore } from '../store';

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

/** scroll p → keyframe pose (fixed / orbit / follow / crane), then the real camera damps toward it */
export function CameraDirector() {
  const { camera, pointer } = useThree();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(KEYS.map((k) => k.pos), false, 'centripetal'), []);
  const target = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3() });
  const cur = useRef({ look: KEYS[0].look.clone(), init: false });
  const focus = useStore((s) => s.focus);
  const tmp = new THREE.Vector3();

  useFrame((_, dt) => {
    const p = live.p;
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const e = smoother(THREE.MathUtils.clamp((p - a.p) / Math.max(1e-6, b.p - a.p), 0, 1));
    curve.getPoint((i + e) / (KEYS.length - 1), target.current.pos);
    target.current.look.copy(a.look).lerp(b.look, e);
    live.mode = e < 0.5 ? a.mode : b.mode;

    // clicked a system sculpture → fly to face it
    if (focus) {
      const s = SYSTEMS.find((x) => x.id === focus);
      if (s) {
        const toRoad = tmp.set(-s.side, 0, 0);
        target.current.pos.copy(s.pos).addScaledVector(toRoad, 8.5).setY(3.2);
        target.current.look.copy(s.pos).setY(2.2);
        live.mode = 'focus';
      }
    }

    const k = reduce ? 1 : 1 - Math.exp(-dt * (focus ? 3 : 5));
    if (!cur.current.init) { camera.position.copy(target.current.pos); cur.current.look.copy(target.current.look); cur.current.init = true; }
    camera.position.lerp(target.current.pos, k);
    cur.current.look.lerp(target.current.look, k);
    // mouse: look follows the pointer a little (±6°)
    const par = !coarse && !reduce && p > 0.155 ? 1 : 0;
    tmp.copy(cur.current.look).sub(camera.position);
    const dist = tmp.length();
    tmp.applyAxisAngle(new THREE.Vector3(0, 1, 0), -pointer.x * 0.1 * par);
    tmp.y += pointer.y * 0.1 * dist * par;
    camera.lookAt(camera.position.clone().add(tmp));
  });
  return null;
}
