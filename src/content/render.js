// Renders src/content/*.json to HTML strings.
// Used at build time for flat.html (readable without JS) and at runtime for the 3D panels,
// so every piece of text lives in exactly one place.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

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
  const result = esc(pr.result);
  return `
  ${kicker(pr.featured ? 'SYSTEMS · 대표 프로젝트' : 'SYSTEMS')}
  <h2>${esc(pr.title)}${pr.live ? ' <span class="live">LIVE</span>' : ''} <span class="sub">${esc(pr.subtitle)}</span></h2>
  <p class="meta">${esc(pr.period)} · ${esc(pr.team)}</p>
  <dl class="case">
    <div><dt>문제 정의</dt><dd>${esc(pr.problem)}</dd></div>
    <div><dt>구조</dt><dd><ol class="flow" aria-label="데이터 흐름">${flowText(pr).map((s) => `<li>${esc(s)}</li>`).join('')}</ol></dd></div>
    ${pr.role || mine.length ? `<div><dt>내 역할</dt><dd>${esc(pr.role || '')}${mine.length ? `<p class="mine">담당 블록: ${mine.map(esc).join(', ')}</p>` : ''}</dd></div>` : ''}
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

/* ---------- whole flat page (default 2D resume) ---------- */
const sec = (id, num, title, body) => `
  <section class="r-sec" id="${id}">
    <h2 class="r-title"><span class="r-num">${num}</span>${esc(title)}</h2>
    ${body}
  </section>`;

function projectSummary(pr) {
  return `
  <details class="proj" id="project-${esc(pr.id)}">
    <summary>
      <span class="proj-head"><strong>${esc(pr.title)}</strong>${pr.live ? ' <span class="live">LIVE</span>' : ''} <span class="proj-sub">${esc(pr.subtitle)}</span></span>
      <span class="proj-meta">${esc(pr.period)} · ${esc(pr.team)}${pr.role ? ` · ${esc(pr.role)}` : ''}</span>
      <span class="proj-result">${esc(pr.result)}</span>
    </summary>
    <div class="proj-body">${projectPanel(pr)}</div>
  </details>`;
}

export function renderFlat({ profile: p, copy: c, projects, research, stack, resume }) {
  const featured = projects.find((x) => x.featured);
  const others = projects.filter((x) => !x.featured);
  return `
  <section class="r-hero" id="top">
    <div class="r-hero-text">
      <p class="r-handle">${esc(p.handle)}</p>
      <h1>${esc(p.nameKo)} <span class="r-en">${esc(p.name)}</span></h1>
      <p class="r-tagline">${esc(p.tagline)}</p>
      <p class="r-headline">${esc(p.headline)}</p>
      <p class="lead">${esc(c.about)}</p>
      <p class="btn-row">
        ${btn('GitHub @' + p.handle, p.links.github, { solid: true })}
        ${btn('⬇ 이력서 PDF', p.links.resume, { download: '안소희-이력서.pdf' })}
        ${btn(`✉ ${p.links.email}`, `mailto:${p.links.email}`)}
        ${btn('Velog ↗', p.links.velog)}
        ${btn('PNU CV Lab ↗', p.links.lab)}
      </p>
    </div>
    <figure class="polaroid r-photo">
      <img src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="800" height="1040" fetchpriority="high" />
      <figcaption>${esc(p.nameKo)} · ${esc(p.handle)}</figcaption>
    </figure>
    <a class="r-3d" href="/3d.html">
      <span class="r-3d-k">3D 버전</span>
      <span class="r-3d-t">${esc(c.question)}</span>
      <span class="r-3d-s">사진 한 장이 점 구름이 되고, 걸어 다닐 수 있는 3D 캠퍼스가 됩니다 →</span>
    </a>
  </section>
  ${sec('focus', '00', '현재 관심 분야', `
    <div class="focus">${p.focus.map((f) => `<article class="focus-card"><h3>${esc(f.title)}</h3><p>${esc(f.body)}</p></article>`).join('')}</div>
    <dl class="now-next"><div><dt>NOW</dt><dd>${esc(p.now)}</dd></div><div><dt>NEXT</dt><dd>${esc(p.next)}</dd></div></dl>`)}
  ${sec('systems', '01', '대표 프로젝트', `<div class="panel panel-featured">${projectPanel(featured)}</div>`)}
  ${sec('projects', '02', '다른 프로젝트', `<p class="muted">눌러서 펼치면 문제 정의·구조·역할·기술적 결정을 볼 수 있습니다.</p>${others.map(projectSummary).join('')}`)}
  ${sec('research', '03', '연구', `<div class="panel">${researchPanel(research)}</div>`)}
  ${sec('resume', '04', '이력서', `
    <div class="cv">
      <div class="cv-row"><h3>학력</h3><ul class="cv-list">${resume.education.map((e) => `<li><span class="cv-when">${esc(e.period)}</span><div><strong>${esc(e.title)}</strong><p>${esc(e.note)}</p></div></li>`).join('')}</ul></div>
      <div class="cv-row"><h3>활동</h3><ul class="cv-list">${resume.activities.map((a) => `<li><span class="cv-when">${esc(a.period)}</span><div><strong>${esc(a.title)}</strong><ul>${a.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></li>`).join('')}</ul></div>
      <div class="cv-row"><h3>기술</h3><dl class="cv-skills">${resume.skills.map((r) => `<div><dt>${esc(r.name)}</dt><dd>${r.items.map(esc).join(' · ')}</dd></div>`).join('')}</dl></div>
    </div>
    <p class="btn-row">${btn('⬇ 이력서 PDF 내려받기', p.links.resume, { solid: true, download: '안소희-이력서.pdf' })}${btn('GitHub @' + p.handle, p.links.github)}${btn(`✉ ${p.links.email}`, `mailto:${p.links.email}`)}</p>`)}
  <p class="ending">${esc(c.ending)}</p>`;
}
