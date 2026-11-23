// Camera rail: stations (plan §6-2) joined by a Catmull-Rom path.
// Between two stations the motion is eased, so the camera naturally lingers at each one.
import * as THREE from 'three';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
export const STATIONS = [
  { key: 'photo',   p: 0.00, pos: v(0, 1.6, 2),       look: v(0, 1.6, -10),    name: '사진 한 장' },
  { key: 'lift',    p: 0.08, pos: v(0, 1.6, 2),       look: v(0, 1.6, -10),    name: '사진 한 장 → 점' },
  { key: 'nvs',     p: 0.13, pos: v(1.6, 1.4, -1),    look: v(0, 1.5, -8),     name: '카메라가 없던 시점' },
  { key: 'fill',    p: 0.18, pos: v(1.5, 1.45, -1.4), look: v(0, 1.5, -8),     name: '못 본 곳 채우기' },
  { key: 'front',   p: 0.25, pos: v(-0.45, 1.5, -2.7), look: v(-2.2, 1.25, -4.1), name: '앞모습 · 내 락커 #1370', chip: 'front' },
  { key: 'side',    p: 0.35, pos: v(0.2, 1.55, -5.6), look: v(2.2, 1.4, -7),    name: '옆모습 · 연구', chip: 'side' },
  { key: 'lockers', p: 0.45, pos: v(0, 1.6, -11),     look: v(-2.2, 1.3, -13.6), name: '락커 · 프로젝트', chip: 'lockers' },
  { key: 'featured',p: 0.53, pos: v(-0.2, 1.5, -14.4), look: v(-2.2, 1.2, -16.6), name: '락커 · 대표 프로젝트 FireGenerators' },
  { key: 'more',    p: 0.61, pos: v(0, 1.6, -18.6),   look: v(-2.2, 1.3, -21.6), name: '락커 · 다른 프로젝트' },
  { key: 'toolkit', p: 0.70, pos: v(0.3, 1.45, -22.6), look: v(2.2, 1.25, -24),  name: '도구함 · 트로피 진열장', chip: 'toolkit' },
  { key: 'back',    p: 0.79, pos: v(0.1, 2.45, -29.5), look: v(0.35, 0, -28.05), name: '뒷모습 · 졸업앨범', chip: 'back' },
  { key: 'turn',    p: 0.86, pos: v(0, 1.7, -30.6),   look: v(0, 1.5, 0),       name: '뒷모습 · 지나온 길' },
  { key: 'hallpass',p: 0.96, pos: v(0.35, 1.55, -33.4), look: v(1.0, 1.45, -36),   name: '복도 통행증 · 연락하기', chip: 'hallpass' },
  { key: 'end',     p: 1.00, pos: v(0.4, 1.55, -33.7), look: v(1.1, 1.45, -36),   name: '복도 통행증 · 연락하기' },
];
// big editorial titles shown when you arrive at a station
export const TITLES = {
  front:    { kicker: '앞모습 · front view', title: '안녕하세요,\n소희예요', sub: '락커에 붙은 학생증을 눌러 보세요 ✿' },
  side:     { kicker: '옆모습 · side view', title: '얼굴을 얼마나 돌려야\n다른 사람이 될까?', sub: '게시판을 누르면 연구 이야기가 펼쳐져요' },
  lockers:  { kicker: '락커 · projects', title: '말하면 써지고,\n찍으면 읽히고', sub: 'FarmForYou · EatWise — 이름표 붙은 락커를 눌러 보세요' },
  featured: { kicker: '대표 프로젝트', title: 'FireGenerators', sub: '반쯤 열린 락커 — 내 금융 수준을 재 주는 AI 코치' },
  more:     { kicker: '락커 · more', title: '리뷰를 읽고,\n교실을 잇고', sub: 'LIVE 스티커가 붙은 Qroom은 지금 바로 써볼 수 있어요' },
  toolkit:  { kicker: '도구함 · toolkit', title: '트로피 대신\n기술 배지', sub: '진열장을 눌러 보세요' },
  back:     { kicker: '뒷모습 · back view', title: 'Class of 2022', sub: '펜실베이니아에서 부산까지 — 졸업앨범을 눌러 보세요' },
  turn:     { kicker: '뒷모습 · back view', title: '지나온 길을\n돌아보면', sub: '맨 처음 사진을 찍은 자리에 분홍색 카메라가 떠 있어요' },
  hallpass: { kicker: '복도 통행증 · hall pass', title: '목적지: 당신의 팀\n시간: 언제든지', sub: '통행증을 누르면 이력서와 연락처가 있어요' },
};
export const SNAP_KEYS = ['photo', 'front', 'side', 'lockers', 'featured', 'more', 'toolkit', 'back', 'turn', 'hallpass'];

const m = new THREE.Matrix4();
const up = v(0, 1, 0);
STATIONS.forEach((s) => { s.quat = new THREE.Quaternion().setFromRotationMatrix(m.lookAt(s.pos, s.look, up)); });
const curve = new THREE.CatmullRomCurve3(STATIONS.map((s) => s.pos), false, 'catmullrom', 0.35);

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** p in [0,1] → { position, quaternion, station (nearest), seg } */
export function sample(p, outPos, outQuat) {
  p = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < STATIONS.length - 2 && p > STATIONS[i + 1].p) i++;
  const a = STATIONS[i], b = STATIONS[i + 1];
  const t = (p - a.p) / Math.max(1e-6, b.p - a.p);
  const e = smoother(Math.min(1, Math.max(0, t)));
  curve.getPoint((i + e) / (STATIONS.length - 1), outPos);
  outQuat.slerpQuaternions(a.quat, b.quat, e);
  return e < 0.5 ? a : b;
}
export const stationP = (key) => STATIONS.find((s) => s.key === key || s.chip === key)?.p ?? 0;
