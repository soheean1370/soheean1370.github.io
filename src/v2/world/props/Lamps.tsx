import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { roadPoint, roadYaw } from '../../road';
import { C } from '../../palette';

// Street lamps: clay poles, warm yellow heads (these feed the soft bloom).
export function Lamps() {
  const mats = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    let k = 0;
    for (let t = 0.04; t < 0.98; t += 0.045) {
      const side = k++ % 2 ? 1 : -1;
      const p = roadPoint(t, side * 4.4);
      out.push(new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roadYaw(t)), new THREE.Vector3(1, 1, 1)));
    }
    return out;
  }, []);
  const poles = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.32, 18, 12).translate(0, 4.4, 0), []);
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.1, 4.3, 10).translate(0, 2.15, 0), []);
  useLayoutEffect(() => {
    mats.forEach((m, i) => { poles.current.setMatrixAt(i, m); heads.current.setMatrixAt(i, m); });
    poles.current.instanceMatrix.needsUpdate = heads.current.instanceMatrix.needsUpdate = true;
  }, [mats]);
  return (
    <group>
      <instancedMesh ref={poles} args={[poleGeo, undefined, mats.length]} castShadow><meshStandardMaterial color={C.shade} roughness={0.8} /></instancedMesh>
      <instancedMesh ref={heads} args={[headGeo, undefined, mats.length]}><meshStandardMaterial color={C.yellow} emissive={C.yellow} emissiveIntensity={2.2} toneMapped={false} /></instancedMesh>
    </group>
  );
}
