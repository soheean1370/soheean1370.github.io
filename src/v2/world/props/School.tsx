import * as THREE from 'three';
import { useMemo } from 'react';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import { C } from '../../palette';

const clay = (c = C.clay) => <meshStandardMaterial color={c} roughness={0.88} />;

function Roof({ w, d, h, y }: { w: number; d: number; h: number; y: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-d / 2 - 0.4, 0); s.lineTo(d / 2 + 0.4, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: w + 0.8, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 });
    g.translate(0, 0, -(w + 0.8) / 2); g.rotateY(Math.PI / 2);
    return g;
  }, [w, d, h]);
  return <mesh geometry={geo} position={[0, y, 0]} castShadow receiveShadow>{clay(C.shade)}</mesh>;
}

/** Red-brick-school silhouette in clay: wings, roof, clock tower, steps, columns, flagpole. */
export function School(props: JSX.IntrinsicElements['group']) {
  const W = 34, H = 8, D = 11;
  const windows = useMemo(() => {
    const out: { p: [number, number, number]; lit: boolean }[] = [];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 14; i++) {
      const x = -W / 2 + 2 + i * ((W - 4) / 13);
      if (Math.abs(x) < 3.2) continue;
      out.push({ p: [x, 2.4 + row * 3, D / 2 + 0.02], lit: (i * 7 + row * 3) % 5 === 0 });
    }
    return out;
  }, []);
  return (
    <group {...props}>
      <RoundedBox args={[W, H, D]} radius={0.35} smoothness={4} position={[0, H / 2, 0]} castShadow receiveShadow>{clay()}</RoundedBox>
      <Roof w={W} d={D} h={3} y={H} />
      {/* entrance block */}
      <RoundedBox args={[7, H + 2, 3]} radius={0.3} position={[0, (H + 2) / 2, D / 2 + 1]} castShadow receiveShadow>{clay(C.clayLight)}</RoundedBox>
      {/* clock tower */}
      <RoundedBox args={[4, 6, 4]} radius={0.25} position={[0, H + 4.5, 0]} castShadow>{clay(C.clayLight)}</RoundedBox>
      <mesh position={[0, H + 9.2, 0]} castShadow><coneGeometry args={[3.1, 3.4, 4, 1]} />{clay(C.shade)}</mesh>
      <mesh position={[0, H + 5.2, 2.02]}><circleGeometry args={[1.1, 40]} /><meshStandardMaterial color={C.clayLight} roughness={0.6} /></mesh>
      <mesh position={[0, H + 5.2, 2.04]} rotation-z={0.6}><boxGeometry args={[0.12, 0.9, 0.02]} /><meshStandardMaterial color={C.ink} /></mesh>
      {/* columns + door */}
      {[-2.6, -0.9, 0.9, 2.6].map((x) => (
        <mesh key={x} position={[x, 3.2, D / 2 + 2.7]} castShadow><cylinderGeometry args={[0.32, 0.36, 6.4, 20]} />{clay(C.clayLight)}</mesh>
      ))}
      <RoundedBox args={[2.4, 3.4, 0.2]} radius={0.08} position={[0, 1.7 + 0.6, D / 2 + 2.52]}><meshStandardMaterial color={C.shade} roughness={0.8} /></RoundedBox>
      {/* steps */}
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[9 - i * 1.2, 0.3, 1.4]} radius={0.08} position={[0, 0.15 + i * 0.3, D / 2 + 4.4 - i * 0.7]} castShadow receiveShadow>{clay(C.clayLight)}</RoundedBox>
      ))}
      {/* windows: a few glow yellow */}
      <Instances limit={64} castShadow={false}>
        <boxGeometry args={[1.3, 1.7, 0.12]} />
        <meshStandardMaterial color={C.shade} roughness={0.5} />
        {windows.filter((w) => !w.lit).map((w, i) => <Instance key={i} position={w.p} />)}
      </Instances>
      <Instances limit={16}>
        <boxGeometry args={[1.3, 1.7, 0.12]} />
        <meshStandardMaterial color={C.yellow} emissive={C.yellow} emissiveIntensity={1.6} toneMapped={false} />
        {windows.filter((w) => w.lit).map((w, i) => <Instance key={i} position={w.p} />)}
      </Instances>
      {/* flagpole */}
      <mesh position={[9, 5, D / 2 + 7]} castShadow><cylinderGeometry args={[0.08, 0.1, 10, 12]} />{clay(C.clayLight)}</mesh>
      <mesh position={[9.9, 9, D / 2 + 7]} castShadow><boxGeometry args={[1.8, 1.1, 0.05]} /><meshStandardMaterial color={C.pink} roughness={0.8} /></mesh>
    </group>
  );
}
