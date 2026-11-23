// Hand-written GLSL for the NVS demo (plan §7-2).
export const REVEAL_HEAD = /* glsl */`
uniform float uReveal;
float nvsHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float nvsNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(nvsHash(i), nvsHash(i + vec2(1, 0)), f.x), mix(nvsHash(i + vec2(0, 1)), nvsHash(i + vec2(1, 1)), f.x), f.y);
}`;
export const REVEAL_BODY = /* glsl */`
  {
    float rn = nvsNoise(gl_FragCoord.xy / 46.0) * 0.72 + nvsHash(floor(gl_FragCoord.xy / 2.0)) * 0.28;
    if (rn > uReveal) discard;
    if (uReveal < 0.999 && rn > uReveal - 0.07) gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.97, 0.66, 0.77) * 1.4, 0.85);
  }
  #include <dithering_fragment>`;

export const POINTS_VERT = /* glsl */`
uniform sampler2D uColor, uDepth;
uniform mat4 uInvViewProj, uFlatM;
uniform float uLift, uPx, uFlatNdcZ, uFlatDist, uNear, uFar, uEdge, uScatter, uRepel, uAspect, uFlatScale;
uniform vec2 uTexel, uMouse;
attribute vec2 aUv;
varying vec3 vColor;
varying float vEdge, vPush;
vec3 hash3(vec2 p) { vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9))); return fract(sin(q) * 43758.5453) - 0.5; }
float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
vec3 unproject(vec2 uv, float ndcZ) { vec4 p = uInvViewProj * vec4(uv * 2.0 - 1.0, ndcZ, 1.0); return p.xyz / p.w; }
void main() {
  float d = texture2D(uDepth, aUv).r;
  float z = lin(d);
  vec3 world = unproject(aUv, d * 2.0 - 1.0);
  vec3 flatP = (uFlatM * vec4(unproject(aUv, uFlatNdcZ), 1.0)).xyz;
  vec3 pos = mix(flatP, world, uLift);
  pos += hash3(aUv * 91.7) * uScatter * sin(3.14159 * uLift) * 0.35 * (0.4 + min(z, 60.0) * 0.06);
  // depth jumps between neighbours = object borders = where holes open
  float zx = lin(texture2D(uDepth, aUv + vec2(uTexel.x, 0.0)).r), zy = lin(texture2D(uDepth, aUv + vec2(0.0, uTexel.y)).r);
  float zx2 = lin(texture2D(uDepth, aUv - vec2(uTexel.x, 0.0)).r), zy2 = lin(texture2D(uDepth, aUv - vec2(0.0, uTexel.y)).r);
  float jump = max(max(abs(zx - z), abs(zy - z)), max(abs(zx2 - z), abs(zy2 - z))) / z;
  vEdge = smoothstep(0.04, 0.12, jump) * uEdge * step(z, 300.0);
  vColor = texture2D(uColor, aUv).rgb;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 dd = (ndc - uMouse) * vec2(uAspect, 1.0);
  float r = length(dd);
  float push = uRepel * smoothstep(0.22, 0.0, r);
  ndc += (dd / max(r, 1e-4)) / vec2(uAspect, 1.0) * push * 0.13;
  gl_Position.xy = ndc * gl_Position.w;
  vPush = push;
  float capZ = mix(uFlatDist, z, uLift);
  gl_PointSize = clamp(uPx * capZ / -mv.z * mix(uFlatScale, 1.0, uLift) * (1.0 + push * 0.8), 1.0, 28.0);
}`;
export const POINTS_FRAG = /* glsl */`
uniform float uAlpha;
varying vec3 vColor;
varying float vEdge, vPush;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  vec3 col = mix(vColor, vec3(0.97, 0.66, 0.77) * 1.8, max(vEdge, vPush * 0.7));
  gl_FragColor = vec4(col, uAlpha);
}`;
