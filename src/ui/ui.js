// HUD (clock, scene name, film progress, NVS stage labels) and the HTML panels.
import * as R from '../content/render.js';

const $ = (id) => document.getElementById(id);

export function startClock() {
  const el = $('clock');
  const fmt = (tz) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());
  const tick = () => { el.textContent = `Busan ${fmt('Asia/Seoul')} · Philly ${fmt('America/New_York')}`; };
  tick(); setInterval(tick, 15000);
}

export function createFilm(count) {
  const ol = $('film');
  ol.innerHTML = Array.from({ length: count }, () => '<li></li>').join('');
  const cells = [...ol.children];
  return (p) => cells.forEach((c, i) => c.classList.toggle('on', i <= Math.floor(p * (count - 0.001))));
}

/* ---------- panels ---------- */
export function createPanels(content, { onOpen, onClose }) {
  const { profile: p, copy: c, projects, research, toolkit, timeline } = content;
  const wrap = $('panel'), body = $('panelBody'), card = wrap.querySelector('.panel-card');
  let lastFocus = null;
  const html = (key) => {
    if (key === 'about') return R.aboutPanel(p, c);
    if (key === 'research') return R.researchPanel(research, c, p);
    if (key === 'featured') return R.featuredPanel(projects.find((x) => x.featured), c);
    if (key === 'toolkit') return R.toolkitPanel(toolkit);
    if (key === 'yearbook') return R.yearbookPanel(timeline, c);
    if (key === 'hallpass') return R.hallPassPanel(p, c);
    if (key.startsWith('project:')) {
      const pr = projects.find((x) => x.id === key.slice(8));
      return `<p class="view-tag">🔒 lockers · project</p>${R.projectCard(pr)}`;
    }
    return '';
  };
  function open(key) {
    lastFocus = document.activeElement;
    body.innerHTML = html(key);
    const h = body.querySelector('h2, h3');
    if (h) h.id = 'panelTitle';
    wrap.classList.add('open');
    wrap.setAttribute('aria-hidden', 'false');
    body.scrollTop = 0;
    setTimeout(() => card.focus(), 50);
    onOpen?.(key);
  }
  function close() {
    if (!wrap.classList.contains('open')) return;
    wrap.classList.remove('open');
    wrap.setAttribute('aria-hidden', 'true');
    lastFocus?.focus?.();
    onClose?.();
  }
  $('panelClose').addEventListener('click', close);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  return { open, close, isOpen: () => wrap.classList.contains('open') };
}

/** every 3D object also exists as a real button (Tab / screen readers) */
export function objectButtons(interactables, open) {
  const nav = $('objectButtons');
  for (const it of interactables) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Open: ${it.label}`;
    b.addEventListener('click', () => open(it.panel));
    nav.append(b);
  }
}
