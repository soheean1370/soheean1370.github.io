import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import * as R from '../../content/render.js';
import profile from '../../content/profile.json';
import copy from '../../content/copy.json';
import projects from '../../content/projects.json';
import research from '../../content/research.json';
import stack from '../../content/stack.json';

function html(panel: NonNullable<ReturnType<typeof useStore.getState>['panel']>) {
  if (panel.kind === 'hello') return R.helloPanel(profile, copy);
  if (panel.kind === 'research') return R.researchPanel(research);
  if (panel.kind === 'stack') return R.stackPanel(stack);
  if (panel.kind === 'contact') return R.contactPanel(profile);
  return R.projectPanel(projects.find((p) => p.id === panel.id));
}

/** glass panel (right on desktop, bottom sheet on mobile); content comes from the same renderer as the 2D page */
export function Panel() {
  const panel = useStore((s) => s.panel);
  const close = useStore((s) => s.close);
  const card = useRef<HTMLDivElement>(null!);
  const last = useRef<Element | null>(null);
  useEffect(() => {
    if (panel) { last.current = document.activeElement; setTimeout(() => card.current?.focus(), 60); }
    else (last.current as HTMLElement | null)?.focus?.();
  }, [panel]);
  return (
    <aside className={`v2-panel${panel ? ' open' : ''}`} aria-hidden={!panel} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="v2-panel-card" role="dialog" aria-modal="true" aria-label="상세 정보" tabIndex={-1} ref={card}>
        <button className="v2-panel-close" type="button" aria-label="닫기" onClick={close}>×</button>
        {panel && <div className="v2-panel-body" dangerouslySetInnerHTML={{ __html: html(panel) }} />}
      </div>
    </aside>
  );
}

/** every clickable 3D object also exists as a real button (Tab / screen readers) */
export function ObjectButtons() {
  const open = useStore((s) => s.open);
  return (
    <nav className="sr-only-focusable" aria-label="3D 공간의 물건 열기">
      <button type="button" onClick={() => open({ kind: 'hello' })}>HELLO · 자기소개 열기</button>
      <button type="button" onClick={() => open({ kind: 'research' })}>RESEARCH · 공부하고 있는 문제 열기</button>
      {projects.map((p) => (
        <button key={p.id} type="button" onClick={() => open({ kind: 'project', id: p.id }, p.id)}>SYSTEMS · {p.title} 열기</button>
      ))}
      <button type="button" onClick={() => open({ kind: 'stack' })}>STACK · 기술 스택 열기</button>
      <button type="button" onClick={() => open({ kind: 'contact' })}>NEXT STOP · 연락처와 이력서 열기</button>
    </nav>
  );
}
