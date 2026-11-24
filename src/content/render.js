// Renders src/content/*.json to HTML strings.
// Used at build time for flat.html (readable without JS) and at runtime for the 3D panels,
// so every piece of text lives in exactly one place.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const todo = (what) => `<span class="todo">[확인 필요${what ? `: ${esc(what)}` : ''}]</span>`;

export function btn(label, url, { solid = false, download } = {}) {
  if (!url) return `<span class="btn is-todo" aria-disabled="true">${esc(label)} <small>준비 중</small></span>`;
  const attrs = download
    ? `href="${esc(url)}" download="${esc(download)}"`
    : url.startsWith('mailto:') ? `href="${esc(url)}"` : `href="${esc(url)}" target="_blank" rel="noopener"`;
  return `<a class="btn${solid ? ' btn-solid' : ''}" ${attrs}>${esc(label)}</a>`;
}
const chips = (items, cls = 'chip') => `<ul class="chips">${items.map((t) => `<li class="${cls}">${esc(t)}</li>`).join('')}</ul>`;
const kicker = (t) => `<p class="kicker">${esc(t)}</p>`;

/** architecture text in data-flow order: "A → B → C" */
export function flowText(pr) {
  const label = Object.fromEntries(pr.nodes.map((n) => [n.id, n.label]));
  const order = [];
  const seen = new Set();
  const visit = (id) => { if (seen.has(id)) return; seen.add(id); order.push(id); pr.edges.filter(([a]) => a === id).forEach(([, b]) => visit(b)); };
  const incoming = new Set(pr.edges.map(([, b]) => b));
  pr.nodes.filter((n) => !incoming.has(n.id)).forEach((n) => visit(n.id));
  return order.map((id) => label[id]);
}

/* ---------- sections ---------- */
export function helloPanel(p, c) {
  return `
  ${kicker('HELLO')}
  <div class="hello">
    <figure class="polaroid hello-photo">
      <img src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="800" height="1040" loading="lazy" />
      <figcaption>${esc(p.nameKo)} · ${esc(p.handle)}</figcaption>
    </figure>
    <div>
      <h2>${esc(p.nameKo)} <span class="sub">${esc(p.name)} · 닉네임 ${esc(p.handle)}</span></h2>
      <ul class="lines">${p.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    </div>
  </div>
  <p class="headline">${esc(p.headline)}</p>
  <p class="lead">${esc(c.about)}</p>
  <p class="label">현재 관심 분야</p>
  <div class="focus">${p.focus.map((f) => `<article class="focus-card"><h3>${esc(f.title)}</h3><p>${esc(f.body)}</p></article>`).join('')}</div>
  <dl class="now-next"><div><dt>NOW</dt><dd>${esc(p.now)}</dd></div><div><dt>NEXT</dt><dd>${esc(p.next)}</dd></div></dl>
  <p class="btn-row">${btn('GitHub ↗', p.links.github, { solid: true })}${btn('PNU CV Lab ↗', p.links.lab)}${btn('Velog ↗', p.links.velog)}</p>`;
}

export function researchPanel(r) {
  return `
  ${kicker('RESEARCH')}
  <h2>공부하고 있는 문제</h2>
  <p class="lead">${esc(r.problem)}</p>
  <blockquote class="pull">${esc(r.angle)}<span lang="en">${esc(r.angleEn)}</span></blockquote>
  <p class="muted">${esc(r.status)}</p>
  <p class="label">논문 정리</p>
  <p class="muted">${esc(r.surveyNote)}</p>
  <div class="board">
    ${r.groups.map((g) => `
    <article class="pin-card">
      <h3><span class="pin-id">${esc(g.id)}</span> ${esc(g.title)}</h3>
      <ul class="papers">${g.papers.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${g.note ? `<p class="note">${esc(g.note)}</p>` : ''}
    </article>`).join('')}
  </div>
  <p class="label">지금 공부 중</p>
  ${chips(r.nowLearning, 'chip chip-soft')}`;
}

export function projectPanel(pr) {
  const mine = pr.nodes.filter((n) => n.mine).map((n) => n.label);
  const result = pr.result + (pr.resultNumbers === null ? ` ${todo('숫자')}` : '');
  return `
  ${kicker(pr.featured ? 'SYSTEMS · 대표 프로젝트' : 'SYSTEMS')}
  <h2>${esc(pr.title)}${pr.live ? ' <span class="live">LIVE</span>' : ''} <span class="sub">${esc(pr.subtitle)}</span></h2>
  <p class="meta">${esc(pr.period)} · ${esc(pr.team)}</p>
  <dl class="case">
    <div><dt>문제 정의</dt><dd>${esc(pr.problem)}</dd></div>
    <div><dt>구조</dt><dd><ol class="flow" aria-label="데이터 흐름">${flowText(pr).map((s) => `<li>${esc(s)}</li>`).join('')}</ol></dd></div>
    <div><dt>내 역할</dt><dd>${pr.role ? esc(pr.role) : todo('역할')}${mine.length ? `<p class="mine">담당 블록: ${mine.map(esc).join(', ')}</p>` : ''}</dd></div>
    <div><dt>기술적 결정</dt><dd><ul>${pr.decisions.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></dd></div>
    <div><dt>결과</dt><dd>${result}</dd></div>
    <div><dt>기술 스택</dt><dd>${chips(pr.stack)}</dd></div>
    <div><dt>링크</dt><dd><p class="btn-row">${pr.links.map((l, i) => btn(`${l.label}${l.url ? ' ↗' : ''}`, l.url, { solid: i === 0 })).join('')}</p>${pr.linkNote ? `<p class="muted">${esc(pr.linkNote)}</p>` : ''}</dd></div>
  </dl>`;
}

export function stackPanel(s) {
  return `
  ${kicker('STACK')}
  <h2>기술 스택</h2>
  <div class="rows">${s.rows.map((r) => `<div class="row"><p class="label">${esc(r.name)}</p>${chips(r.items, 'chip chip-badge')}</div>`).join('')}</div>
  <p class="muted">이 사이트: ${s.thisSite.map(esc).join(' · ')}</p>`;
}

export function contactPanel(p) {
  return `
  ${kicker('NEXT STOP')}
  <h2>연락처와 이력서</h2>
  <p class="btn-row">
    ${btn('⬇ 이력서 다운로드 (PDF)', p.links.resume, { solid: true, download: '안소희-이력서.pdf' })}
    ${btn(`✉ ${p.links.email}`, `mailto:${p.links.email}`)}
    ${btn('GitHub ↗', p.links.github)}
    ${btn('Velog ↗', p.links.velog)}
    ${btn('PNU CV Lab ↗', p.links.lab)}
  </p>`;
}

/* ---------- whole flat page ---------- */
export function renderFlat({ profile: p, copy: c, projects, research, stack }) {
  const featured = projects.find((x) => x.featured);
  const others = projects.filter((x) => !x.featured);
  return `
  <section class="hero" id="top">
    <figure class="polaroid hero-polaroid">
      <img src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="800" height="1040" fetchpriority="high" />
      <figcaption>${esc(p.nameKo)} · ${esc(p.handle)}</figcaption>
    </figure>
    <div class="hero-text">
      <p class="hero-q">${esc(c.question)}</p>
      <h1>${esc(p.nameKo)} <span class="hero-handle">${esc(p.handle)}</span></h1>
      <p class="hero-tagline">${esc(p.tagline)}</p>
      <p class="headline">${esc(p.headline)}</p>
      ${chips(p.interests, 'chip chip-accent')}
      <p class="btn-row">
        ${btn('GitHub ↗', p.links.github, { solid: true })}
        ${btn('⬇ 이력서 (PDF)', p.links.resume, { download: '안소희-이력서.pdf' })}
        ${btn(`✉ ${p.links.email}`, `mailto:${p.links.email}`)}
      </p>
    </div>
  </section>

  <section class="panel" id="hello">${helloPanel(p, c)}</section>
  <section class="panel" id="research">${researchPanel(research)}</section>
  <section class="panel panel-featured" id="systems">${projectPanel(featured)}</section>
  ${others.map((pr) => `<section class="panel" id="project-${esc(pr.id)}">${projectPanel(pr)}</section>`).join('\n  ')}
  <section class="panel" id="stack">${stackPanel(stack)}</section>
  <section class="panel" id="contact">${contactPanel(p)}<p class="ending">${esc(c.ending)}</p></section>`;
}
