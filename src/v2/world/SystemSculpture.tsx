import * as THREE from 'three';
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { flowText } from '../../content/render.js';
import { FONT_TTF } from './fonts';
import { C } from '../palette';
import { useStore } from '../store';

type Node = { id: string; label: string; kind: string; mine?: boolean };
type Project = { id: string; title: string; subtitle: string; featured?: boolean; live?: boolean; nodes: Node[]; edges: [string, string][] };

const GLOW = new THREE.Color(C.pink).multiplyScalar(2.6);
const KIND: Record<string, string> = { input: C.clayLight, model: C.clay, api: C.clayDark, db: C.shade, front: C.clayLight };
const BW = 1.85, GAP = 2.3;

/** lay the graph out left→right in data-flow order; extra entry points (feedback loops, side inputs) float above their target */
function layout(pr: Project) {
  const order = flowText(pr).map((label: string) => pr.nodes.find((n) => n.label === label)!.id);
  const incoming = new Set(pr.edges.map(([, b]) => b));
  const pos = new Map<string, THREE.Vector3>();
  const chain = order.filter((id: string, i: number) => i === 0 || incoming.has(id));
  chain.forEach((id: string, i: number) => pos.set(id, new THREE.Vector3((i - (chain.length - 1) / 2) * GAP, 1.25 + (i % 2) * 0.75, 0)));
  order.filter((id: string) => !pos.has(id)).forEach((id: string) => {
    const to = pr.edges.find(([a]) => a === id)?.[1];
    const t = to && pos.get(to);
    pos.set(id, t ? t.clone().add(new THREE.Vector3(0, 2.3, -1.4)) : new THREE.Vector3(0, 3.5, -1.4));
  });
  return { pos, width: chain.length * GAP };
}

export function SystemSculpture({ project, ...props }: { project: Project } & JSX.IntrinsicElements['group']) {
  const { pos, width } = useMemo(() => layout(project), [project]);
  const open = useStore((s) => s.open);
  const [hover, setHover] = useState(false);
  const curves = useMemo(() => project.edges.map(([a, b]) => {
    const A = pos.get(a)!, B = pos.get(b)!;
    const from = A.clone().add(new THREE.Vector3(Math.sign(B.x - A.x) * BW * 0.45 || 0, 0, 0));
    const to = B.clone().add(new THREE.Vector3(-Math.sign(B.x - A.x) * BW * 0.45 || 0, 0, 0));
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.6, 0.3));
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }), [project, pos]);
  const tubes = useMemo(() => curves.map((c) => new THREE.TubeGeometry(c, 24, 0.09, 10, false)), [curves]);
  const packets = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    curves.forEach((c, i) => {
      for (let k = 0; k < 2; k++) {
        const m = packets.current[i * 2 + k];
        if (m) m.position.copy(c.getPoint(((t * 0.35 + k * 0.5 + i * 0.13) % 1)));
      }
    });
  });

  const activate = (e: any) => { e.stopPropagation(); open({ kind: 'project', id: project.id }, project.id); };
  return (
    <group {...props} scale={project.featured ? 1.15 : 1}
      onClick={activate}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}>
      <RoundedBox args={[width + 1.4, 0.3, 3.4]} radius={0.12} position={[0, 0.15, -0.3]} castShadow receiveShadow>
        <meshStandardMaterial color={hover ? C.horizon : C.clayLight} roughness={0.85} />
      </RoundedBox>
      <Text font={FONT_TTF} fontSize={0.62} position={[-(width + 1.4) / 2 + 0.2, 4.6, -0.3]} anchorX="left" color={C.ink}>
        {project.title}
      </Text>
      <Text font={FONT_TTF} fontSize={0.26} position={[-(width + 1.4) / 2 + 0.22, 4.05, -0.3]} anchorX="left" color={C.ink} fillOpacity={0.7}>
        {project.featured ? 'FEATURED · click to open' : 'click to open'}
      </Text>
      {project.live && (
        <Text font={FONT_TTF} fontSize={0.7} position={[(width + 1.4) / 2 - 0.2, 4.6, -0.3]} anchorX="right" color={C.pink}>
          LIVE
          <meshBasicMaterial color={GLOW} toneMapped={false} />
        </Text>
      )}
      {project.nodes.map((n) => {
        const p = pos.get(n.id)!;
        return (
          <group key={n.id} position={p}>
            <RoundedBox args={[BW, 0.9, 0.9]} radius={0.16} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial color={n.mine ? C.horizon : KIND[n.kind]} roughness={0.8} />
            </RoundedBox>
            {n.mine && (
              <RoundedBox args={[BW + 0.16, 1.06, 1.06]} radius={0.2} smoothness={4}>
                <meshBasicMaterial color={GLOW} side={THREE.BackSide} toneMapped={false} />
              </RoundedBox>
            )}
            <Text font={FONT_TTF} fontSize={0.19} maxWidth={BW - 0.2} textAlign="center" position={[0, 0, 0.47]} color={C.ink} anchorY="middle">
              {n.label}
            </Text>
          </group>
        );
      })}
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g}><meshStandardMaterial color={C.clayLight} transparent opacity={0.45} roughness={0.2} /></mesh>
      ))}
      {curves.flatMap((_, i) => [0, 1].map((k) => (
        <mesh key={`${i}-${k}`} ref={(m) => { if (m) packets.current[i * 2 + k] = m; }}>
          <sphereGeometry args={[0.11, 12, 8]} />
          <meshBasicMaterial color={GLOW} toneMapped={false} />
        </mesh>
      )))}
    </group>
  );
}
