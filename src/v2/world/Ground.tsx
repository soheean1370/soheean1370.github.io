import * as THREE from 'three';
import { useMemo } from 'react';
import { ROAD, ROAD_WIDTH } from '../road';
import { C } from '../palette';

function ribbon(halfInner: number, halfOuter: number, y: number, segments = 360) {
  const pos: number[] = [], idx: number[] = [];
  const p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    ROAD.getPointAt(u, p); ROAD.getTangentAt(u, t);
    const nx = -t.z, nz = t.x;
    pos.push(p.x + nx * halfInner, y, p.z + nz * halfInner, p.x + nx * halfOuter, y, p.z + nz * halfOuter);
    if (i < segments) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // make sure normals point up whatever the winding
  const n = g.getAttribute('normal'); for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

export function Ground() {
  const road = useMemo(() => ribbon(-ROAD_WIDTH / 2, ROAD_WIDTH / 2, 0.02), []);
  const walkL = useMemo(() => ribbon(-ROAD_WIDTH / 2 - 1.6, -ROAD_WIDTH / 2, 0.1), []);
  const walkR = useMemo(() => ribbon(ROAD_WIDTH / 2, ROAD_WIDTH / 2 + 1.6, 0.1), []);
  const dash = useMemo(() => ribbon(-0.08, 0.08, 0.03), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -80]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={C.clay} roughness={0.95} />
      </mesh>
      <mesh geometry={road} receiveShadow><meshStandardMaterial color={C.shade} roughness={0.85}/></mesh>
      <mesh geometry={walkL} receiveShadow><meshStandardMaterial color={C.clayLight} roughness={0.9}/></mesh>
      <mesh geometry={walkR} receiveShadow><meshStandardMaterial color={C.clayLight} roughness={0.9}/></mesh>
      <mesh geometry={dash}><meshStandardMaterial color={C.clayLight} roughness={0.9}/></mesh>
    </group>
  );
}
