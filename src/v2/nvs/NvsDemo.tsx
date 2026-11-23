import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CAPTURE } from '../layout';
import { live, useStore } from '../store';
import { C } from '../palette';
import { REVEAL_HEAD, REVEAL_BODY, POINTS_VERT, POINTS_FRAG } from './shaders';

export const reveal = { value: 1 };
export const nvsOut = { snapshot: '' };
const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ss = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function patchReveal(root: THREE.Object3D) {
  root.traverse((o: any) => {
    if (!o.isMesh || o.userData.noReveal || o.text !== undefined) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || m.userData.revealPatched || m.isShaderMaterial) continue;
      m.userData.revealPatched = true;
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (sh: any, r: any) => {
        prev?.call(m, sh, r);
        sh.uniforms.uReveal = reveal;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${REVEAL_HEAD}`).replace('#include <dithering_fragment>', REVEAL_BODY);
      };
      const key = m.customProgramCacheKey?.bind(m);
      m.customProgramCacheKey = () => (key ? key() : '') + 'nvs';
      m.needsUpdate = true;
    }
  });
}

/** Scene [0]–[1]: polaroid → points lifted by depth → holes from a new view → hallway... campus dissolves in. */
export function NvsDemo() {
  const { gl, scene, size, pointer, camera } = useThree();
  const vMode = useStore((s) => s.vMode);
  const setReady = useStore((s) => s.setReady);
  const CAP_W = isMobile ? 640 : 1024, CAP_H = Math.round(CAP_W / 1.6);
  const GRID_W = isMobile ? 200 : 320, GRID_H = Math.round(GRID_W / 1.6);
  const D = 3.2;

  const capCam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(CAPTURE.fov, 1.6, 0.1, 600);
    c.position.copy(CAPTURE.pos); c.lookAt(CAPTURE.look); c.updateMatrixWorld(); return c;
  }, []);
  const rt = useMemo(() => {
    const r = new THREE.WebGLRenderTarget(CAP_W, CAP_H, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(CAP_W, CAP_H) });
    r.depthTexture.minFilter = r.depthTexture.magFilter = THREE.NearestFilter; return r;
  }, []);

  const halfH = Math.tan(THREE.MathUtils.degToRad(CAPTURE.fov / 2)) * D, halfW = halfH * 1.6;
  const caption = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 900;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 900);
    g.fillStyle = C.ink; g.font = '700 54px "Pretendard Variable", Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('안소희 · soheean1370', 512, 830);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const polaroid = useRef<THREE.Group>(null!);
  const frameMat = useRef<THREE.MeshBasicMaterial>(null!);
  const home = useMemo(() => {
    const p = CAPTURE.pos.clone().add(new THREE.Vector3(0, 0, -D).applyQuaternion(capCam.quaternion));
    const m = new THREE.Matrix4().compose(p, capCam.quaternion, new THREE.Vector3(1, 1, 1));
    return { p, q: capCam.quaternion.clone(), inv: m.clone().invert(), down: new THREE.Vector3(0, -1, 0).applyQuaternion(capCam.quaternion) };
  }, []);

  const { geo, uniforms } = useMemo(() => {
    const n = GRID_W * GRID_H, aUv = new Float32Array(n * 2);
    for (let j = 0, k = 0; j < GRID_H; j++) for (let i = 0; i < GRID_W; i++, k += 2) { aUv[k] = (i + 0.5) / GRID_W; aUv[k + 1] = (j + 0.5) / GRID_H; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('aUv', new THREE.BufferAttribute(aUv, 2));
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const near = capCam.near, far = capCam.far;
    live.points = n;
    return {
      geo: g,
      uniforms: {
        uColor: { value: rt.texture }, uDepth: { value: rt.depthTexture },
        uInvViewProj: { value: new THREE.Matrix4().multiplyMatrices(capCam.matrixWorld, capCam.projectionMatrixInverse) },
        uFlatM: { value: new THREE.Matrix4() }, uLift: { value: 0 }, uPx: { value: 4 }, uAlpha: { value: 1 }, uEdge: { value: 0 },
        uScatter: { value: reduce ? 0 : 1 }, uRepel: { value: reduce ? 0 : 1 }, uAspect: { value: 1 }, uFlatScale: { value: 1 },
        uMouse: { value: new THREE.Vector2(9, 9) }, uFlatDist: { value: D },
        uFlatNdcZ: { value: (far + near) / (far - near) - (2 * far * near) / ((far - near) * D) },
        uNear: { value: near }, uFar: { value: far }, uTexel: { value: new THREE.Vector2(2 / CAP_W, 2 / CAP_H) },
      },
    };
  }, []);
  const points = useRef<THREE.Points>(null!);
  const frustum = useMemo(() => {
    const s = 1.0, hh = Math.tan(THREE.MathUtils.degToRad(CAPTURE.fov / 2)) * s, hw = hh * 1.6;
    const c = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => new THREE.Vector3(x, y, -s));
    const v: number[] = [];
    c.forEach((p, i) => { const q = c[(i + 1) % 4]; v.push(0, 0, 0, p.x, p.y, p.z, p.x, p.y, p.z, q.x, q.y, q.z); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: C.pink, fog: false }));
    l.position.copy(capCam.position); l.quaternion.copy(capCam.quaternion);
    return l;
  }, []);

  const state = useRef({ frames: 0, captured: false });
  const um = useRef(new THREE.Vector2(9, 9));
  const vMix = useRef(0);
  const bg = useMemo(() => ({ light: new THREE.Color(C.horizon), dark: new THREE.Color('#2A2438') }), []);
  const moved = useRef(false);
  useEffect(() => {
    const on = () => { moved.current = true; };
    addEventListener('pointermove', on);
    return () => { removeEventListener('pointermove', on); rt.dispose(); geo.dispose(); };
  }, []);

  useFrame((_, dt) => {
    const st = state.current;
    // wait a few frames so shadows/fonts settle, then take "the photo"
    if (!st.captured) {
      if (++st.frames < 24) { reveal.value = 1; points.current.visible = false; polaroid.current.visible = false; return; }
      patchReveal(scene);
      const hide = [points.current, polaroid.current, frustum];
      hide.forEach((o) => { o.visible = false; });
      reveal.value = 1;
      gl.setRenderTarget(rt); gl.render(scene, capCam); gl.setRenderTarget(null);
      // small tone-mapped JPEG of the same photo for the ending polaroid
      const tm = gl.toneMapping;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      const prevPR = gl.getPixelRatio();
      gl.setPixelRatio(1); gl.setSize(960, 600, false);
      gl.render(scene, capCam);
      nvsOut.snapshot = gl.domElement.toDataURL('image/jpeg', 0.88);
      gl.toneMapping = tm; gl.setPixelRatio(prevPR); gl.setSize(size.width, size.height, false);
      scene.traverse((o: any) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => { m.needsUpdate = true; }); });
      st.captured = true;
      setReady();
    }

    const p = live.p;
    vMix.current += ((vMode ? 1 : 0) - vMix.current) * Math.min(1, dt * 5);
    const vm = vMix.current;
    const toFull = ss(0.0, 0.03, p), lift = ss(0.032, 0.07, p), fill = ss(0.112, 0.15, p);
    const dark = Math.max(ss(0.025, 0.065, p) * (1 - ss(0.125, 0.152, p)), vm);
    (scene.background as THREE.Color).copy(bg.light).lerp(bg.dark, dark);
    const sky = scene.getObjectByName('sky'); if (sky) sky.visible = dark < 0.5;

    // polaroid grows from a tilted card to the full view
    const s = 0.5 + 0.5 * toFull;
    const pg = polaroid.current;
    pg.visible = p < 0.034 && vm < 0.01;
    pg.position.copy(home.p).addScaledVector(home.down, (1 - toFull) * 0.1);
    pg.quaternion.copy(home.q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((1 - toFull) * pointer.y * 0.08, (1 - toFull) * pointer.x * 0.08, (1 - toFull) * -0.05)));
    pg.scale.setScalar(s);
    frameMat.current.opacity = 1 - toFull;
    pg.updateMatrixWorld();
    uniforms.uFlatM.value.multiplyMatrices(pg.matrixWorld, home.inv);
    uniforms.uFlatScale.value = s;

    if (moved.current) um.current.lerp(pointer, Math.min(1, dt * 12));
    uniforms.uMouse.value.copy(um.current);
    uniforms.uAspect.value = size.width / size.height;
    const ratio = Math.tan(THREE.MathUtils.degToRad(CAPTURE.fov / 2)) / Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    uniforms.uPx.value = (gl.getDrawingBufferSize(new THREE.Vector2()).y * ratio / GRID_H) * 2.0;

    points.current.visible = p < 0.155 || vm > 0.01;
    uniforms.uLift.value = vm > 0.01 ? 1 : lift;
    uniforms.uEdge.value = Math.max(ss(0.07, 0.1, p), vm);
    uniforms.uAlpha.value = vm > 0.01 ? vm : 1 - ss(0.13, 0.155, p);
    reveal.value = fill * (1 - vm);
    frustum.visible = p > 0.14 || vm > 0.01;
  });

  return (
    <>
      <group ref={polaroid} userData={{ noReveal: true }}>
        <mesh position={[0, -halfH * 0.21, -0.004]} userData={{ noReveal: true }}>
          <planeGeometry args={[halfW * 2 + halfW * 0.14, halfH * 2 + halfW * 0.14 + halfH * 0.42]} />
          <meshBasicMaterial ref={frameMat} map={caption} transparent fog={false} toneMapped={false} />
        </mesh>
      </group>
      <points ref={points} geometry={geo} frustumCulled={false} userData={{ noReveal: true }}>
        <shaderMaterial uniforms={uniforms} vertexShader={POINTS_VERT} fragmentShader={POINTS_FRAG} transparent depthWrite />
      </points>
      <primitive object={frustum} />
    </>
  );
}
