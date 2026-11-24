import { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { live, useStore } from '../store';
import { nvsOut } from '../nvs/NvsDemo';
import { scrollToP } from '../App';
import copy from '../../content/copy.json';
import profile from '../../content/profile.json';
import { SECTIONS } from '../layout';

/** short card that appears by itself at each stop, so every section is readable without hunting for clicks */
const CARDS: Record<string, { title: string; body: string; open: any }> = {
  hello: { title: `${profile.nameKo} · ${profile.handle}`, body: profile.headline, open: { kind: 'hello' } },
  research: { title: '공부하고 있는 문제', body: '사진 한 장으로 다른 각도를 만들되, 같은 사람으로 보이게. 논문 15편을 4가지 접근으로 정리했습니다.', open: { kind: 'research' } },
  systems: { title: '만든 시스템 6개', body: '조형물 하나가 프로젝트 하나입니다. 분홍 테두리 블록이 제가 맡은 부분이에요. 조형물을 누르면 자세히 볼 수 있습니다.', open: { kind: 'project', id: 'firegenerators' } },
  stack: { title: '기술 스택', body: '배지에 마우스를 올리면 그 기술을 쓴 프로젝트로 빛줄기가 이어집니다.', open: { kind: 'stack' } },
  nextstop: { title: '연락처와 이력서', body: '이력서 PDF, 이메일, GitHub를 여기서 볼 수 있습니다.', open: { kind: 'contact' } },
};
export function StopCard() {
  const [key, setKey] = useState('');
  const open = useStore((s) => s.open);
  const panelOpen = useStore((s) => !!s.panel);
  useEffect(() => {
    const id = setInterval(() => {
      const p = live.p;
      const s = SECTIONS.find((x) => Math.abs(x.p - p) < 0.025);
      setKey(s && p < 0.965 ? s.key : '');
    }, 200);
    return () => clearInterval(id);
  }, []);
  const c = key ? CARDS[key] : null;
  return (
    <div className={`stop-card${c && !panelOpen ? ' show' : ''}`} aria-live="polite">
      {c && (<>
        <p className="kicker">{SECTIONS.find((s) => s.key === key)!.label.toUpperCase()}</p>
        <h2>{c.title}</h2>
        <p>{c.body}</p>
        <button type="button" className="btn btn-solid" onClick={() => open(c.open, c.open.id ?? null)}>자세히 보기</button>
      </>)}
    </div>
  );
}

export function Ending() {
  const ref = useRef<HTMLElement>(null!);
  const img = useRef<HTMLImageElement>(null!);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = live.p;
      const flash = Math.min(1, Math.max(0, (p - 0.965) / 0.025));
      ref.current.style.setProperty('--flash', String(flash));
      ref.current.classList.toggle('on', flash > 0.01);
      ref.current.classList.toggle('done', p > 0.988);
      if (!img.current.src && nvsOut.snapshot) img.current.src = nvsOut.snapshot;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section className="ending" ref={ref} aria-label="엔딩">
      <div className="ending-flash" />
      <figure className="ending-polaroid">
        <img ref={img} alt="처음 그 캠퍼스 사진" width={960} height={600} />
        <figcaption>{copy.ending}</figcaption>
      </figure>
      <p className="ending-actions">
        <button className="btn btn-solid" type="button" onClick={() => scrollToP(0, 3)}>↺ 처음부터 다시 보기</button>
        <a className="btn" href={profile.links.resume} download="안소희-이력서.pdf">⬇ 이력서</a>
        <a className="btn" href={profile.links.github} target="_blank" rel="noopener">GitHub ↗</a>
        <a className="btn" href="/flat.html">2D 버전</a>
      </p>
    </section>
  );
}

export function Loader() {
  const ready = useStore((s) => s.ready);
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`loader${ready ? ' done' : ''}`} aria-hidden={ready}>
      <div className="loader-photo"><span>현상 중…</span></div>
      <a className={`loader-skip${slow ? ' show' : ''}`} href="/flat.html">2D 버전으로 보기 →</a>
    </div>
  );
}

/** D key: developer overlay — fps, draw calls, triangles, points, camera mode */
export function DevStats() {
  const { gl } = useThree();
  const acc = useRef({ t: 0, n: 0 });
  useFrame((_, dt) => {
    const a = acc.current; a.t += dt; a.n++;
    if (a.t > 0.5) {
      const el = document.getElementById('dev');
      if (el) el.textContent = `fps ${Math.round(a.n / a.t)} · draw calls ${gl.info.render.calls} · triangles ${gl.info.render.triangles.toLocaleString('en-US')} · points ${live.points.toLocaleString('en-US')} · camera ${live.mode} · quality ${useStore.getState().quality}`;
      a.t = 0; a.n = 0;
    }
  });
  return null;
}
export function DevOverlay() {
  const dev = useStore((s) => s.dev);
  return <p id="dev" className={`dev${dev ? ' show' : ''}`} aria-hidden={!dev} />;
}
