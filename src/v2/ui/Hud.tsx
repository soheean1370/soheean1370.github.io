import { useEffect, useRef, useState } from 'react';
import { live, useStore } from '../store';
import { SECTIONS } from '../layout';
import { scrollToP } from '../App';
import profile from '../../content/profile.json';
import copy from '../../content/copy.json';

export function TopBar() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      const p = live.p;
      const s = [...SECTIONS].reverse().find((x) => p >= x.p - 0.03);
      setActive(p < 0.16 ? '' : s?.key ?? '');
    }, 250);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="bar">
      <a className="bar-brand" href="#" onClick={(e) => { e.preventDefault(); scrollToP(0, 3); }}>soheean1370</a>
      <nav className="bar-views" aria-label="구간">
        {SECTIONS.map((s, i) => (
          <a key={s.key} href={`#${s.key}`} className={active === s.key ? 'is-active' : ''} onClick={(e) => { e.preventDefault(); scrollToP(s.p); }}>
            <span className="num">{i + 1}</span> {s.label}
          </a>
        ))}
      </nav>
      <div className="bar-actions">
        <a href={profile.links.github} target="_blank" rel="noopener">GitHub</a>
        <a href={profile.links.resume} download="안소희cv.pdf">이력서</a>
        <a className="pill" href="/">2D 이력서</a>
      </div>
    </header>
  );
}

const STAGES: [number, number, string][] = [
  [0.0, 0.03, 'input: 1 RGB image'],
  [0.03, 0.07, 'depth → unproject → points'],
  [0.07, 0.11, 'novel view → disocclusion'],
  [0.11, 0.155, 'inpaint the unseen → full scene'],
];

/** bottom-left technical status + first-screen copy; updated from the render loop without re-rendering React */
export function Hud() {
  const stage = useRef<HTMLParagraphElement>(null!);
  const cam = useRef<HTMLParagraphElement>(null!);
  const intro = useRef<HTMLDivElement>(null!);
  const vMode = useStore((s) => s.vMode);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = live.p;
      const st = STAGES.find(([a, b]) => p >= a && p < b);
      stage.current.textContent = vMode ? 'view synthesis mode · V로 돌아가기' : st && p > 0.002 ? st[2] : '';
      stage.current.classList.toggle('show', !!stage.current.textContent);
      cam.current.textContent = `camera: ${live.mode} · fov ${live.fov}°${live.points ? ` · ${live.points.toLocaleString('en-US')} pts` : ''}`;
      intro.current.style.opacity = String(Math.max(0, 1 - p / 0.02));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vMode]);
  return (
    <div className="hud">
      <div className="intro" ref={intro}>
        <p className="intro-q">{copy.question}</p>
        <h1 className="intro-tag"><span className="sr-only">{profile.nameKo} ({profile.handle}) — </span>{profile.tagline}</h1>
        <p className="intro-scroll">스크롤해서 사진 속으로 ↓</p>
      </div>
      <div className="hud-bl">
        <p className="hud-stage" ref={stage} aria-live="polite" />
        <p className="hud-cam" ref={cam} />
      </div>
      <p className="hud-br"><kbd>V</kbd> 점으로 보기, <kbd>D</kbd> 개발자 정보</p>
    </div>
  );
}
