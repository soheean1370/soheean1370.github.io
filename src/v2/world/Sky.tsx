import * as THREE from 'three';
import { useMemo } from 'react';
import { C } from '../palette';

// Hand-written gradient sky: horizon pink → blue-hour blue, with a soft glow where the sun just set.
export function Sky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(C.sky) },
      uHorizon: { value: new THREE.Color(C.horizon) },
      uGlow: { value: new THREE.Color(C.yellow) },
      uSunDir: { value: new THREE.Vector3(0.85, 0.05, -0.52).normalize() },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTop, uHorizon, uGlow, uSunDir;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.55, h), 0.8));
        float sun = pow(max(dot(vDir, uSunDir), 0.0), 18.0);
        col = mix(col, uGlow, sun * 0.45 * (1.0 - h));
        if (vDir.y < 0.0) col = uHorizon;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  return <mesh name="sky" material={mat} scale={400}><sphereGeometry args={[1, 48, 24]} /></mesh>;
}
