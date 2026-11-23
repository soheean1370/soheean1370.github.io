// "One photo → every angle", done for real:
// 1) render the hallway once from the photo camera into color + depth (the photo),
// 2) lift every pixel of a grid back into 3D with the inverse view-projection (depth → points),
// 3) move the camera: regions the photo never saw become holes (edges glow pink),
// 4) dissolve the real hallway in ("fill the unseen") while the points fade.
import * as THREE from 'three';
import { canvasTex, text, F, PAL } from '../world/textures.js';

/* ---------- reveal (dissolve) patch for every world material ---------- */
export const reveal = { value: 1 };
const NOISE = /* glsl */`
uniform float uReveal;
float nvsHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float nvsNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(nvsHash(i), nvsHash(i + vec2(1, 0)), f.x), mix(nvsHash(i + vec2(0, 1)), nvsHash(i + vec2(1, 1)), f.x), f.y);
}`;
const DISSOLVE = /* glsl */`
  {
    float rn = nvsNoise(gl_FragCoord.xy / 42.0) * 0.72 + nvsHash(floor(gl_FragCoord.xy / 2.0)) * 0.28;
    if (rn > uReveal) discard;
    if (uReveal < 0.999 && rn > uReveal - 0.07) gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.886, 0.855, 0.961), 0.85);
  }
  #include <dithering_fragment>`;
export function patchReveal(root) {
  const seen = new Set();
  root.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      if (seen.has(m) || o.isLine || o.isPoints) continue;
      seen.add(m);
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uReveal = reveal;
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>\n${NOISE}`)
          .replace('#include <dithering_fragment>', DISSOLVE);
      };
      m.customProgramCacheKey = () => 'nvs-reveal';
      m.needsUpdate = true;
    }
  });
}

/* ---------- points ---------- */
const VERT = /* glsl */`
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform mat4 uInvViewProj;
uniform float uLift, uPx, uFlatNdcZ, uFlatDist, uNear, uFar, uEdge, uScatter, uRepel, uAspect, uFlatScale;
uniform vec2 uTexel, uMouse;
uniform mat4 uFlatM;
attribute vec2 aUv;
varying vec3 vColor;
varying float vEdge;
varying float vPush;
vec3 hash3(vec2 p) { vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9))); return fract(sin(q) * 43758.5453) - 0.5; }
float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
vec3 unproject(vec2 uv, float ndcZ) { vec4 p = uInvViewProj * vec4(uv * 2.0 - 1.0, ndcZ, 1.0); return p.xyz / p.w; }
void main() {
  float d = texture2D(uDepth, aUv).r;
  vec3 world = unproject(aUv, d * 2.0 - 1.0);
  vec3 flat_ = (uFlatM * vec4(unproject(aUv, uFlatNdcZ), 1.0)).xyz;
  vec3 pos = mix(flat_, world, uLift);
  // burst: mid-lift every point flies off a little, then settles at its depth
  pos += hash3(aUv * 91.7) * uScatter * sin(3.14159 * uLift) * 0.35 * (0.4 + lin(d) * 0.08);
  float z = lin(d);
  float zx = lin(texture2D(uDepth, aUv + vec2(uTexel.x, 0.0)).r);
  float zy = lin(texture2D(uDepth, aUv + vec2(0.0, uTexel.y)).r);
  float zx2 = lin(texture2D(uDepth, aUv - vec2(uTexel.x, 0.0)).r);
  float zy2 = lin(texture2D(uDepth, aUv - vec2(0.0, uTexel.y)).r);
  float jump = max(max(abs(zx - z), abs(zy - z)), max(abs(zx2 - z), abs(zy2 - z))) / z;
  vEdge = smoothstep(0.03, 0.09, jump) * uEdge;
  vColor = texture2D(uColor, aUv).rgb;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  // the cursor pushes pixels away (screen space)
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 dd = (ndc - uMouse) * vec2(uAspect, 1.0);
  float r = length(dd);
  float push = uRepel * smoothstep(0.22, 0.0, r);
  ndc += (dd / max(r, 1e-4)) / vec2(uAspect, 1.0) * push * 0.13;
  gl_Position.xy = ndc * gl_Position.w;
  vPush = push;
  float capZ = mix(uFlatDist, z, uLift);
  gl_PointSize = clamp(uPx * capZ / -mv.z * mix(uFlatScale, 1.0, uLift) * (1.0 + push * 0.8), 1.0, 26.0);
}`;
const FRAG = /* glsl */`
uniform float uAlpha;
varying vec3 vColor;
varying float vEdge;
varying float vPush;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  vec3 col = mix(vColor, vec3(0.95, 0.55, 0.68) * 1.6, max(vEdge, vPush * 0.7));
  gl_FragColor = vec4(col, uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createNVS({ renderer, scene, world, pose, isMobile }) {
  const CAP_W = isMobile ? 640 : 1024, CAP_H = Math.round(CAP_W / 1.6);
  const GRID_W = isMobile ? 200 : 320, GRID_H = Math.round(GRID_W / 1.6);
  const capCam = new THREE.PerspectiveCamera(60, 1.6, 0.1, 60);
  capCam.position.copy(pose.position);
  capCam.quaternion.copy(pose.quaternion);
  capCam.updateMatrixWorld();

  const rt = new THREE.WebGLRenderTarget(CAP_W, CAP_H, {
    type: THREE.HalfFloatType,
    depthTexture: new THREE.DepthTexture(CAP_W, CAP_H),
  });
  rt.depthTexture.minFilter = rt.depthTexture.magFilter = THREE.NearestFilter;

  function capture() {
    const prev = reveal.value;
    reveal.value = 1;
    const hidden = [polaroid, points, fr].map((o) => { const v = o.visible; o.visible = false; return [o, v]; });
    const bg = scene.background;
    renderer.setRenderTarget(rt);
    renderer.render(scene, capCam);
    renderer.setRenderTarget(null);
    scene.background = bg;
    reveal.value = prev;
    hidden.forEach(([o, v]) => { o.visible = v; });
  }

  // the polaroid: photo plane + white frame with a handwritten caption, D meters in front of the photo camera
  const D = 2.2;
  const halfH = Math.tan(THREE.MathUtils.degToRad(30)) * D, halfW = halfH * 1.6;
  const polaroid = new THREE.Group();
  polaroid.position.copy(capCam.position).add(new THREE.Vector3(0, 0, -D).applyQuaternion(capCam.quaternion));
  polaroid.quaternion.copy(capCam.quaternion);
  const photoMat = new THREE.MeshBasicMaterial({ map: rt.texture, fog: false });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, halfH * 2), photoMat);
  const capTex = canvasTex(1024, 900, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    text(g, '안소희 · soheean1370', w / 2, h - 70, `700 64px ${F.handKo}`, PAL.deep);
  });
  const frameMat = new THREE.MeshBasicMaterial({ map: capTex, transparent: true, fog: false, toneMapped: false });
  const pad = halfW * 0.07;
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2 + pad * 2, halfH * 2 + pad * 2 + halfH * 0.42), frameMat);
  frame.position.set(0, -halfH * 0.21, -0.002);
  polaroid.add(frame, photo);
  scene.add(polaroid);

  // the points
  const n = GRID_W * GRID_H;
  const aUv = new Float32Array(n * 2);
  for (let j = 0, k = 0; j < GRID_H; j++) for (let i = 0; i < GRID_W; i++, k += 2) {
    aUv[k] = (i + 0.5) / GRID_W; aUv[k + 1] = (j + 0.5) / GRID_H;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('aUv', new THREE.BufferAttribute(aUv, 2));
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const near = capCam.near, far = capCam.far;
  const uniforms = {
    uColor: { value: rt.texture }, uDepth: { value: rt.depthTexture },
    uInvViewProj: { value: new THREE.Matrix4().multiplyMatrices(capCam.matrixWorld, capCam.projectionMatrixInverse) },
    uLift: { value: 0 }, uPx: { value: 4 }, uAlpha: { value: 1 }, uEdge: { value: 0 },
    uScatter: { value: 0 }, uRepel: { value: 0 }, uAspect: { value: 1 }, uFlatScale: { value: 1 },
    uMouse: { value: new THREE.Vector2(9, 9) }, uFlatM: { value: new THREE.Matrix4() },
    uFlatDist: { value: D }, uFlatNdcZ: { value: (far + near) / (far - near) - (2 * far * near) / ((far - near) * D) },
    uNear: { value: near }, uFar: { value: far },
    uTexel: { value: new THREE.Vector2(2 / CAP_W, 2 / CAP_H) },
  };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: true }));
  points.frustumCulled = false;
  scene.add(points);

  // the photo camera stays in the hallway as a thin frustum
  const fr = (() => {
    const s = 0.7, hh = Math.tan(THREE.MathUtils.degToRad(30)) * s, hw = hh * 1.6;
    const c = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => new THREE.Vector3(x, y, -s));
    const v = [];
    c.forEach((p, i) => { v.push(0, 0, 0, p.x, p.y, p.z); const q = c[(i + 1) % 4]; v.push(p.x, p.y, p.z, q.x, q.y, q.z); });
    v.push(-hw * 0.4, hh * 1.1, -s, 0, hh * 1.5, -s, 0, hh * 1.5, -s, hw * 0.4, hh * 1.1, -s); // little "up" roof
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xd4708c, transparent: true, opacity: 0.9, fog: false }));
    l.position.copy(capCam.position); l.quaternion.copy(capCam.quaternion);
    scene.add(l); return l;
  })();

  function setPointPx(drawingBufferHeight, mainFovDeg) {
    const ratio = Math.tan(THREE.MathUtils.degToRad(30)) / Math.tan(THREE.MathUtils.degToRad(mainFovDeg / 2));
    uniforms.uPx.value = (drawingBufferHeight * ratio / GRID_H) * 2.1;
  }

  const home = polaroid.position.clone(), down = new THREE.Vector3(0, -1, 0).applyQuaternion(capCam.quaternion);
  polaroid.updateMatrixWorld();
  const homeInv = polaroid.matrixWorld.clone().invert();
  /** keep the flat (photo) points glued to the polaroid as it scales/tilts */
  function syncFlat() {
    polaroid.updateMatrixWorld();
    uniforms.uFlatM.value.multiplyMatrices(polaroid.matrixWorld, homeInv);
    uniforms.uFlatScale.value = polaroid.scale.x;
  }
  /** a small JPEG of the photo, for the ending polaroid and sharing */
  function snapshot(resize) {
    const hidden = [polaroid, points, fr].map((o) => { const v = o.visible; o.visible = false; return [o, v]; });
    const prev = reveal.value; reveal.value = 1;
    const pr = renderer.getPixelRatio();
    renderer.setPixelRatio(1);
    renderer.setSize(960, 600, false);
    renderer.render(scene, capCam);
    const url = renderer.domElement.toDataURL('image/jpeg', 0.88);
    renderer.setPixelRatio(pr);
    reveal.value = prev;
    hidden.forEach(([o, v]) => { o.visible = v; });
    resize();
    return url;
  }
  return { home, down, syncFlat, snapshot, capture, polaroid, frame, frameMat, photo, points, uniforms, frustum: fr, setPointPx, D };
}
