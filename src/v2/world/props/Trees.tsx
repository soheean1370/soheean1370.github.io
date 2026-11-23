import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { roadPoint } from '../../road';
import { C } from '../../palette';

// Clay trees (a few merged spheres) instanced along both sides of the road, skipping busy spots.
export function Trees({ skip = [] as [number, number][] }) {
  const crown = useMemo(() => {
    const parts = [[0, 0, 0, 1.6], [0.9, -0.3, 0.4, 1.15], [-0.8, -0.2, -0.3, 1.2], [0.1, 0.9, -0.2, 1.05]].map(([x, y, z, r]) => {
      const g = new THREE.SphereGeometry(r, 18, 14); g.translate(x, y, z); return g;
    });
    const m = mergeGeometries(parts); m.translate(0, 3.6, 0); return m;
  }, []);
  const spots = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    let k = 0;
    for (let t = 0.02; t < 0.99; t += 0.018) {
      if (skip.some(([a, b]) => t > a && t < b)) continue;
      for (const side of [-1, 1]) {
        k++;
        const off = side * (7.5 + ((k * 37) % 7) * 0.6);
        const p = roadPoint(t, off);
        const s = 0.8 + ((k * 13) % 5) * 0.1;
        out.push(new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), k), new THREE.Vector3(s, s, s)));
      }
    }
    return out;
  }, [skip]);
  const crowns = useRef<THREE.InstancedMesh>(null!);
  const trunks = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    spots.forEach((m, i) => { crowns.current.setMatrixAt(i, m); trunks.current.setMatrixAt(i, m); });
    crowns.current.instanceMatrix.needsUpdate = trunks.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <group>
      <instancedMesh ref={crowns} args={[crown, undefined, spots.length]} castShadow receiveShadow>
        <meshStandardMaterial color={C.clayLight} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 3, 10]} />
        <meshStandardMaterial color={C.shade} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}
