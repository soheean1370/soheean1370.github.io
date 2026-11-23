import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { Experience } from './world/Experience';
import { live, useStore } from './store';
import { CAPTURE } from './layout';
import { TopBar, Hud } from './ui/Hud';
import { Panel, ObjectButtons } from './ui/Panel';
import { StopCard, Ending, Loader, DevStats, DevOverlay } from './ui/Overlays';
import { useStore as useS } from './store';

const debug = new URLSearchParams(location.search).has('debug');
const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export let lenis: Lenis | null = null;
export const scrollToP = (p: number, duration = 2) => lenis?.scrollTo(p * lenis.limit, { duration: reduce ? 0 : duration });

export function App() {
  const quality = useStore((s) => s.quality);
  const setQuality = useStore((s) => s.setQuality);
  const panelOpen = useStore((s) => !!s.panel);

  useEffect(() => {
    if (isMobile) setQuality('low');
    lenis = new Lenis({ lerp: reduce ? 1 : 0.075, wheelMultiplier: 0.8 });
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input,textarea')) return;
      if (e.key === 'v' || e.key === 'V') useS.getState().toggleV();
      if (e.key === 'd' || e.key === 'D') useS.getState().toggleDev();
      if (e.key === 'Escape') useS.getState().close();
    };
    addEventListener('keydown', onKey);
    lenis.on('scroll', (l: Lenis) => { live.p = l.progress || 0; live.velocity = l.velocity; });
    let raf = 0;
    const tick = (t: number) => { lenis!.raf(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    if (debug) Object.assign(window, { __lenis: lenis, __live: live });
    return () => { cancelAnimationFrame(raf); lenis?.destroy(); removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => { panelOpen ? lenis?.stop() : lenis?.start(); }, [panelOpen]);

  return (
    <>
      <div className="canvas-wrap">
        <Canvas
          shadows="soft"
          dpr={[1, isMobile ? 1.5 : 2]}
          gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping, preserveDrawingBuffer: false }}
          camera={{ position: CAPTURE.pos.toArray(), fov: CAPTURE.fov, near: 0.1, far: 900 }}
          onCreated={({ camera, gl, scene }) => { camera.lookAt(CAPTURE.look); if (debug) Object.assign(window, { __gl: gl, __scene: scene, __cam: camera }); }}
        >
          <PerformanceMonitor onDecline={() => setQuality('low')} />
          <AdaptiveDpr pixelated={false} />
          <DevStats />
          <Experience quality={quality} debug={debug && new URLSearchParams(location.search).has('orbit')} />
          {debug && new URLSearchParams(location.search).has('orbit') && <OrbitControls target={CAPTURE.look} makeDefault />}
        </Canvas>
      </div>
      <TopBar />
      <Hud />
      <StopCard />
      <Panel />
      <ObjectButtons />
      <Ending />
      <DevOverlay />
      <Loader />
      <div className="scroll-space" aria-hidden="true" />
    </>
  );
}
