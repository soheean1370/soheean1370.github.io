import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Line } from '@react-three/drei';
import { C } from '../../palette';
import { FONT_TTF } from '../fonts';
import { Title3D } from '../Title3D';
import { SystemSculpture } from '../SystemSculpture';
import { useStore } from '../../store';
import { roadPoint, roadYaw } from '../../road';
import { SCHOOL, HELLO_SIGN, RIG, SYSTEMS, SYSTEMS_SIGN, BLEACHERS, BUS_STOP } from '../../layout';
import projects from '../../../content/projects.json';
import research from '../../../content/research.json';
import stack from '../../../content/stack.json';

const clickable = (onClick: () => void) => ({
  onClick: (e: any) => { e.stopPropagation(); onClick(); },
  onPointerOver: (e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; },
  onPointerOut: () => { document.body.style.cursor = ''; },
});
const yawTo = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z);
const GLOW = new THREE.Color(C.pink).multiplyScalar(2.4);

/* ---------- [2] HELLO ---------- */
export function Hello() {
  const open = useStore((s) => s.open);
  return (
    <group {...clickable(() => open({ kind: 'hello' }))}>
      <Title3D text="HELLO" size={1.7} position={HELLO_SIGN} rotation-y={SCHOOL.rotY} />
    </group>
  );
}

/* ---------- [3] RESEARCH — multi-view capture rig ---------- */
function MiniCam({ highlight }: { highlight: boolean }) {
  return (
    <group>
      <RoundedBox args={[0.7, 0.46, 0.4]} radius={0.08} castShadow><meshStandardMaterial color={highlight ? C.pink : C.clayLight} roughness={0.7} /></RoundedBox>
      <mesh position={[0, 0, 0.3]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.15, 0.17, 0.22, 20]} /><meshStandardMaterial color={C.shade} /></mesh>
      <mesh position={[0, -0.9, 0]}><cylinderGeometry args={[0.03, 0.03, 1.6, 8]} /><meshStandardMaterial color={C.shade} /></mesh>
    </group>
  );
}
export function Research() {
  const open = useStore((s) => s.open);
  const bust = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { bust.current.rotation.y += dt * 0.35; });
  const R = 4.6, head = new THREE.Vector3(0, 2.7, 0);
  const cams = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return new THREE.Vector3(Math.sin(a) * R, 2.3, Math.cos(a) * R);
  }), []);
  // the "original photo" camera is the one facing the road
  const toRoad = roadPoint(0.25).sub(RIG).setY(0).normalize();
  const firstIdx = cams.reduce((best, c, i) => (c.clone().setY(0).normalize().dot(toRoad) > cams[best].clone().setY(0).normalize().dot(toRoad) ? i : best), 0);
  return (
    <group position={RIG}>
      <group {...clickable(() => open({ kind: 'research' }))}>
        <RoundedBox args={[2.2, 0.8, 2.2]} radius={0.15} position={[0, 0.4, 0]} castShadow receiveShadow><meshStandardMaterial color={C.clayLight} roughness={0.85} /></RoundedBox>
        <group ref={bust} position={[0, 0.8, 0]}>
          <mesh position={[0, 0.85, 0]} scale={[1.25, 0.55, 0.75]} castShadow><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color={C.clay} roughness={0.85} /></mesh>
          <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.28, 0.34, 0.6, 20]} /><meshStandardMaterial color={C.clay} roughness={0.85} /></mesh>
          <mesh position={[0, 1.95, 0]} scale={[0.62, 0.75, 0.66]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={C.clay} roughness={0.85} /></mesh>
          <mesh position={[0, 2.0, 0.55]} castShadow><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={C.clay} roughness={0.85} /></mesh>
        </group>
        {cams.map((c, i) => (
          <group key={i}>
            <group position={c} rotation-y={yawTo(c, new THREE.Vector3(0, c.y, 0))}><MiniCam highlight={i === firstIdx} /></group>
            <Line points={[c, head]} color={i === firstIdx ? C.pink : C.shade} lineWidth={i === firstIdx ? 2.5 : 1} dashed={i !== firstIdx} dashSize={0.18} gapSize={0.14} transparent opacity={i === firstIdx ? 1 : 0.7} />
          </group>
        ))}
      </group>
      {research.groups.map((g, i) => {
        const a = Math.PI * 0.15 + (i / 3) * Math.PI * 0.7 + Math.PI;
        const p = new THREE.Vector3(Math.sin(a) * 8, 0, Math.cos(a) * 8);
        return (
          <group key={g.id} position={p} rotation-y={yawTo(p, new THREE.Vector3())} {...clickable(() => open({ kind: 'research' }))}>
            <RoundedBox args={[1.3, 3.2, 1.3]} radius={0.18} position={[0, 1.6, 0]} castShadow receiveShadow><meshStandardMaterial color={C.clayLight} roughness={0.85} /></RoundedBox>
            <Text font={FONT_TTF} fontSize={0.7} position={[0, 2.4, 0.67]} color={C.ink}>{g.id}</Text>
            <Text font={FONT_TTF} fontSize={0.17} maxWidth={1.1} textAlign="center" position={[0, 1.7, 0.67]} color={C.ink}>{g.title}</Text>
          </group>
        );
      })}
      <Title3D text="RESEARCH" size={1.3} position={[0, 4.6, 0]} rotation-y={yawTo(RIG, roadPoint(0.24)) } />
    </group>
  );
}

/* ---------- [4] SYSTEMS ---------- */
function LockerWalls() {
  const mats = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let t = 0.385; t < 0.67; t += 0.0029) for (const side of [-1, 1]) {
      const p = roadPoint(t, side * 20);
      out.push(new THREE.Matrix4().compose(p.setY(1.15), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roadYaw(t)), new THREE.Vector3(1, 1, 1)));
    }
    return out;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null!);
  const geo = useMemo(() => new THREE.BoxGeometry(0.56, 2.3, 0.6), []);
  useLayoutEffect(() => { mats.forEach((m, i) => ref.current.setMatrixAt(i, m)); ref.current.instanceMatrix.needsUpdate = true; }, [mats]);
  return <instancedMesh ref={ref} args={[geo, undefined, mats.length]} castShadow receiveShadow><meshStandardMaterial color={C.clayLight} roughness={0.7} /></instancedMesh>;
}
export function Systems() {
  return (
    <group>
      <Title3D text="SYSTEMS" size={1.6} position={SYSTEMS_SIGN} rotation-y={roadYaw(0.37) + Math.PI + 0.5} />
      {SYSTEMS.map((s, i) => (
        <SystemSculpture key={s.id} project={projects[i] as any} position={s.pos} rotation-y={roadYaw(s.t) + (s.side > 0 ? -Math.PI / 2 : Math.PI / 2)} />
      ))}
      <LockerWalls />
    </group>
  );
}

/* ---------- [5] STACK — bleachers ---------- */
export function Stack() {
  const open = useStore((s) => s.open);
  const [hot, setHot] = useState<string | null>(null);
  const face = yawTo(BLEACHERS, roadPoint(0.78));
  const rows = stack.rows;
  const beams = useMemo(() => {
    if (!hot) return [];
    const key = hot.toLowerCase().split(' ')[0];
    return SYSTEMS.filter((s, i) => (projects[i] as any).stack.some((x: string) => x.toLowerCase().includes(key))).map((s) => s.pos.clone().setY(2));
  }, [hot]);
  return (
    <group>
      <group position={BLEACHERS} rotation-y={face}>
        {rows.map((r, i) => (
          <group key={r.name} position={[0, 0.35 + i * 0.7, -i * 1.4]}>
            <RoundedBox args={[16, 0.7, 1.4]} radius={0.12} castShadow receiveShadow><meshStandardMaterial color={i % 2 ? C.clay : C.clayLight} roughness={0.85} /></RoundedBox>
            <Text font={FONT_TTF} fontSize={0.3} position={[-7.6, 0.6, 0.2]} anchorX="left" color={C.ink} fillOpacity={0.7}>{r.name}</Text>
            {r.items.map((it, k) => {
              const x = -4.6 + k * 1.75;
              return (
                <group key={it} position={[x, 0.75, 0.1]}
                  onPointerOver={(e) => { e.stopPropagation(); setHot(it); document.body.style.cursor = 'pointer'; }}
                  onPointerOut={() => { setHot(null); document.body.style.cursor = ''; }}
                  onClick={(e) => { e.stopPropagation(); open({ kind: 'stack' }); }}>
                  <RoundedBox args={[1.6, 0.8, 0.18]} radius={0.08} castShadow><meshStandardMaterial color={hot === it ? C.pink : '#ffffff'} roughness={0.4} transparent opacity={0.92} /></RoundedBox>
                  <Text font={FONT_TTF} fontSize={0.2} maxWidth={1.45} textAlign="center" position={[0, 0, 0.1]} color={C.ink}>{it}</Text>
                </group>
              );
            })}
          </group>
        ))}
        <Title3D text="STACK" size={1.5} position={[0, 4.2, -6.5]} />
      </group>
      {/* football field + goal post behind */}
      <mesh rotation-x={-Math.PI / 2} position={BLEACHERS.clone().add(new THREE.Vector3(-14, 0.03, -6))} receiveShadow><planeGeometry args={[18, 34]} /><meshStandardMaterial color={C.clayLight} roughness={0.95} /></mesh>
      <group position={BLEACHERS.clone().add(new THREE.Vector3(-14, 0, -22))}>
        <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.1, 0.1, 3.2, 10]} /><meshStandardMaterial color={C.yellow} /></mesh>
        <mesh position={[0, 3.2, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.08, 0.08, 5, 10]} /><meshStandardMaterial color={C.yellow} /></mesh>
        {[-2.5, 2.5].map((x) => <mesh key={x} position={[x, 4.6, 0]}><cylinderGeometry args={[0.07, 0.07, 2.8, 10]} /><meshStandardMaterial color={C.yellow} /></mesh>)}
      </group>
      {beams.map((to, i) => {
        const from = BLEACHERS.clone().setY(3);
        return <Line key={i} points={[from, from.clone().lerp(to, 0.5).setY(9), to]} color={GLOW} lineWidth={2.5} transparent opacity={0.9} />;
      })}
    </group>
  );
}

/* ---------- [6] NEXT STOP — school bus ---------- */
export function NextStop() {
  const open = useStore((s) => s.open);
  const face = roadYaw(0.93) + Math.PI / 2;
  return (
    <group position={BUS_STOP} {...clickable(() => open({ kind: 'contact' }))}>
      <group rotation-y={face}>
        {/* bus */}
        <group position={[3.4, 0, -2.5]}>
          <RoundedBox args={[2.5, 2.4, 8]} radius={0.35} smoothness={4} position={[0, 1.65, 0]} castShadow receiveShadow><meshStandardMaterial color={C.yellow} roughness={0.7} /></RoundedBox>
          <RoundedBox args={[2.3, 1.2, 1.4]} radius={0.3} position={[0, 1.05, -4.4]} castShadow><meshStandardMaterial color={C.yellow} roughness={0.7} /></RoundedBox>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[-1.27, 2.2, -2.6 + i * 1.05]} rotation-y={-Math.PI / 2}><planeGeometry args={[0.85, 0.7]} /><meshStandardMaterial color={C.shade} roughness={0.3} /></mesh>
          ))}
          {[[-3, 1], [-3, -1], [2.6, 1], [2.6, -1]].map(([z, x], i) => (
            <mesh key={i} position={[x * 1.2, 0.5, z]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.5, 0.5, 0.35, 20]} /><meshStandardMaterial color={C.ink} roughness={0.9} /></mesh>
          ))}
        </group>
        {/* stop sign */}
        <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 3.2, 10]} /><meshStandardMaterial color={C.shade} /></mesh>
        <RoundedBox args={[2.6, 1.2, 0.12]} radius={0.1} position={[0, 3.3, 0]} castShadow><meshStandardMaterial color="#ffffff" roughness={0.5} /></RoundedBox>
        <Text font={FONT_TTF} fontSize={0.26} position={[0, 3.52, 0.08]} color={C.ink}>NEXT STOP</Text>
        <Text font={FONT_TTF} fontSize={0.32} position={[0, 3.1, 0.08]} color={C.ink}>YOUR TEAM</Text>
        <Title3D text="NEXT STOP" size={1.2} position={[0, 5.4, -3]} />
      </group>
    </group>
  );
}
