import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { roadPoint, roadYaw } from '../../road';
import { flyT } from '../../layout';
import { live } from '../../store';
import { C } from '../../palette';

/** the little vintage camera we follow — looking for "where the camera never was" */
export function FlyingCamera() {
  const g = useRef<THREE.Group>(null!);
  const p = new THREE.Vector3();
  useFrame(({ clock }, dt) => {
    const t = Math.min(0.97, flyT(live.p) + 0.02);
    roadPoint(t, 0, p);
    p.y = 3.6 + Math.sin(clock.elapsedTime * 2.2) * 0.12;
    g.current.visible = live.p > 0.155 && live.p < 0.97;
    g.current.position.lerp(p, 1 - Math.exp(-dt * 6));
    const yaw = roadYaw(t);
    g.current.rotation.y += (yaw - g.current.rotation.y) * (1 - Math.exp(-dt * 4));
    g.current.rotation.z = Math.sin(clock.elapsedTime * 1.3) * 0.08;
  });
  return (
    <group ref={g} scale={0.8}>
      <RoundedBox args={[1.1, 0.72, 0.55]} radius={0.14} castShadow><meshStandardMaterial color={C.clayLight} roughness={0.7} /></RoundedBox>
      <RoundedBox args={[1.12, 0.22, 0.57]} radius={0.08} position={[0, 0.25, 0]}><meshStandardMaterial color={C.shade} roughness={0.7} /></RoundedBox>
      <mesh position={[0.05, -0.02, -0.38]} rotation-x={Math.PI / 2} castShadow><cylinderGeometry args={[0.26, 0.3, 0.32, 28]} /><meshStandardMaterial color={C.shade} roughness={0.6} /></mesh>
      <mesh position={[0.05, -0.02, -0.55]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.19, 0.19, 0.04, 28]} /><meshPhysicalMaterial color={C.sky} roughness={0.05} metalness={0.2} clearcoat={1} /></mesh>
      <mesh position={[0.38, 0.27, -0.1]}><boxGeometry args={[0.18, 0.1, 0.12]} /><meshStandardMaterial color={C.yellow} emissive={C.yellow} emissiveIntensity={2.5} toneMapped={false} /></mesh>
      <mesh position={[-0.35, 0.44, 0]}><cylinderGeometry args={[0.07, 0.07, 0.1, 16]} /><meshStandardMaterial color={C.pink} /></mesh>
    </group>
  );
}
