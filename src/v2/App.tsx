import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';
import { useState } from 'react';
import { Experience } from './world/Experience';

const debug = new URLSearchParams(location.search).has('debug');
const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;

export function App() {
  const [quality, setQuality] = useState<'high' | 'low'>(isMobile ? 'low' : 'high');
  return (
    <Canvas
      shadows="soft"
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      camera={{ position: [1.2, 1.8, 16], fov: 42, near: 0.1, far: 900 }}
      onCreated={({ camera, gl, scene }) => { camera.lookAt(-5, 3.2, -14); if (debug) Object.assign(window, { __gl: gl, __scene: scene, __cam: camera }); }}
    >
      <PerformanceMonitor onDecline={() => setQuality('low')} />
      <AdaptiveDpr pixelated={false} />
      <Experience quality={quality} />
      {debug && <OrbitControls target={[-4, 3, -14]} makeDefault />}
    </Canvas>
  );
}
