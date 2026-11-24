# 📷 One Photo, Every Angle — 안소희 (soheean1370)

> *카메라가 없던 자리에서 보면, 이 사진은 어떤 모습일까?*

Novel View Synthesis(사진 한 장으로 새로운 시점 만들기)를 주제로 한 3D 포트폴리오입니다.
해 질 녘 미국 고등학교 캠퍼스를 찍은 폴라로이드 한 장이 깊이를 가진 점으로 떠오르고, 시점이 돌며 카메라가 보지 못한 구멍이 드러난 뒤, 그 구멍이 채워지며 걸어 다닐 수 있는 3D 캠퍼스가 됩니다.

- 기본 화면 (2D 이력서형 포트폴리오): https://soheean1370.github.io/
- 3D 버전: https://soheean1370.github.io/3d.html

## 구성
| 구간 | 장소 | 카메라 | 내용 |
|---|---|---|---|
| 0–1 | 폴라로이드 → 점 구름 | 고정 → 궤도 | NVS 데모 (실제 깊이 재투영) |
| 2 HELLO | 학교 정문 | 고정 → 따라가기 | 자기소개, 관심 분야, 링크 |
| 3 RESEARCH | 멀티뷰 촬영 리그 | 반 바퀴 궤도 | 공부하고 있는 문제, 논문 정리 (분류·이름만) |
| 4 SYSTEMS | 사물함 길 | 따라가기 + 패닝 | 프로젝트 6개를 시스템 구조도 조형물로 |
| 5 STACK | 관중석 | 크레인 | 기술 스택 (배지에 올리면 해당 프로젝트로 빛줄기) |
| 6 NEXT STOP | 스쿨버스 정류장 | 고정 | 연락처, 이력서 PDF |

## 조작
- 스크롤: 길을 따라 이동 · 위쪽 바의 1–5: 구간 이동
- 조형물·물건 클릭: 상세 패널 (모든 물건은 Tab으로 이동 가능한 버튼으로도 있음)
- `V`: 점 구름 모드 · `D`: 개발자 오버레이 (fps, draw calls, 삼각형 수, 점 개수) · `Esc`: 패널 닫기
- WebGL을 쓸 수 없거나 `prefers-reduced-motion`이면 2D 이력서로 이동

## NVS 데모 원리
1. 로딩 때 정문 앞 카메라에서 장면을 색 + 깊이(`WebGLRenderTarget` + `DepthTexture`)로 한 번 렌더 → "사진 한 장"
2. 320×200 격자 점(모바일 200×125)의 버텍스 셰이더가 깊이를 읽고 캡처 카메라의 역 view-projection 행렬로 월드 좌표를 복원
3. 카메라를 35° 돌리면 사진에 없던 영역이 구멍으로 드러남. 이웃 점과 깊이 차이가 큰 점(물체 경계)은 핑크로 표시
4. 실제 장면 재질에 노이즈 디졸브 셰이더를 주입해 구멍을 채우듯 드러냄

## 기술
- Vite · React 18 · React Three Fiber · drei · @react-three/postprocessing (N8AO, Bloom, Vignette, ACES) · zustand · Lenis
- 직접 쓴 GLSL: 점 구름 재투영, 구멍 경계, 디졸브, 그라데이션 하늘
- 외부 3D 모델 없음 — 학교, 나무, 버스, 조형물 모두 코드로 생성
- 프로젝트 조형물은 `src/content/projects.json`의 그래프(nodes/edges)에서 자동 생성되고, 패널 글도 같은 데이터에서 만들어져 항상 일치
- 배포: GitHub Actions → GitHub Pages

```bash
npm install
npm run dev      # http://localhost:5173  (?debug&orbit 로 자유 시점)
npm run build
```

## 구조
```
index.html            기본 화면: 2D 이력서 (src/content를 빌드 때 HTML로 구움)
3d.html               3D 버전
src/content/          모든 글 (profile, copy, research, projects, stack, resume) + render.js
src/v2/               3D: layout(장면 배치·카메라 키프레임), world/, nvs/, ui/
public/               resume.pdf, photos/profile.webp, og-image.png, fonts/
```

## AI 사용 고지
- 본인: 컨셉, 연구 주제와 논문 정리, 프로젝트 내용, 기획서, 최종 판단과 확인
- Claude Code: 코드 구현(3D 장면, 셰이더, UI, 배포 설정), 문구 다듬기 초안
- 참고 사이트의 코드·모델·텍스처·문구·레이아웃은 사용하지 않았습니다. 폰트는 OFL(Pretendard, Inter, JetBrains Mono)과 three.js 예제 폰트(helvetiker)를 사용했습니다.
