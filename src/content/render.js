// Renders the portfolio content (src/content/*.json) to HTML strings.
// Used at build time for flat.html (static, readable without JS) and at runtime for the 3D panels,
// so every piece of text lives in exactly one place.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const todo = (what) => `<span class="todo">[확인 필요${what ? `: ${esc(what)}` : ''}]</span>`;

export function btn(label, url, { solid = false, download, icon = '' } = {}) {
  if (!url) return `<span class="btn is-todo" aria-disabled="true">${icon}${esc(label)} <small>soon</small></span>`;
  const attrs = download
    ? `href="${esc(url)}" download="${esc(download)}"`
    : url.startsWith('mailto:') ? `href="${esc(url)}"` : `href="${esc(url)}" target="_blank" rel="noopener"`;
  return `<a class="btn${solid ? ' btn-solid' : ''}" ${attrs}>${icon}${esc(label)}</a>`;
}
const chips = (items, cls = 'chip') => `<ul class="chips">${items.map((t) => `<li class="${cls}">${esc(t)}</li>`).join('')}</ul>`;
const viewTag = (emoji, label) => `<p class="view-tag"><span aria-hidden="true">${emoji}</span> ${esc(label)}</p>`;

/* ---------- pieces ---------- */
export function idCard(p) {
  return `
  <div class="idcard">
    <div class="idcard-face idcard-front">
      <p class="idcard-kicker">${esc(p.idFront.school)}</p>
      <div class="idcard-row">
        <img class="idcard-photo" src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="120" height="156" loading="lazy" />
        <div>
          <p class="idcard-name">${esc(p.name)} <span lang="ko">${esc(p.nameKo)}</span></p>
          <p class="idcard-handle">@${esc(p.handle)}</p>
          <p class="idcard-line">${esc(p.idFront.degree)}</p>
          <p class="idcard-line">${esc(p.idFront.role)}</p>
        </div>
      </div>
    </div>
    <div class="idcard-face idcard-back">
      <p class="idcard-kicker">${esc(p.idBack.school)}</p>
      <p class="idcard-line"><b>${esc(p.idBack.class)}</b> · ${esc(p.idBack.place)}</p>
    </div>
  </div>`;
}

export function aboutPanel(p, c) {
  return `
  ${viewTag('🍡', 'front view · my locker #1370')}
  <h2>Hi, I'm Sohee.</h2>
  ${idCard(p)}
  <p class="lead">${esc(c.en.about)}</p>
  <p class="label">interests</p>
  ${chips(p.interests.map((t) => `♡ ${t}`), 'chip chip-pink')}
  <p class="btn-row">${btn('GitHub ↗', p.links.github)}${btn('PNU CV Lab ↗', p.links.lab)}</p>`;
}

export function researchPanel(r, c, p) {
  return `
  ${viewTag('☁', 'side view · research')}
  <h2>${esc(r.center)}</h2>
  <blockquote class="pull">${esc(c.en.researchQuestion)}<span>${esc(c.en.researchDetail)}</span></blockquote>
  <p class="muted">${esc(r.surveyNote)}</p>
  <div class="board">
    ${r.groups.map((g) => `
    <article class="pin-card">
      <p class="pin-kind"><span class="pin-id">${esc(g.id)}</span> ${esc(g.kind)}</p>
      <h3>${esc(g.title)}</h3>
      <ul class="papers">${g.papers.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="pro">＋ ${esc(g.good)}</p>
      <p class="con">－ ${esc(g.bad)}</p>
    </article>`).join('')}
  </div>
  <p class="label">🌱 now learning</p>
  ${chips(p.nowLearning, 'chip chip-sage')}
  <p class="btn-row">${btn('Velog notes ↗', p.links.velog)}</p>`;
}

export function featuredPanel(f, c) {
  return `
  ${viewTag('🔒', 'lockers · featured project')}
  <h2>${esc(f.title)} <span class="sub">— ${esc(f.subtitle)}</span></h2>
  <p class="meta">${esc(f.period)} · ${esc(f.team)}</p>
  <dl class="case">
    <div><dt>Problem</dt><dd>${esc(f.problem)}</dd></div>
    <div><dt>My role</dt><dd>${esc(f.role)}</dd></div>
    <div><dt>What I built</dt><dd>
      <ol class="flow" aria-label="pipeline">${f.flow.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <ul>${f.built.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    </dd></div>
    <div><dt>Stack</dt><dd>${chips(f.stack)}</dd></div>
    <div><dt>Result</dt><dd>${esc(f.result)}${f.resultNumbers ? ` ${esc(f.resultNumbers)}` : ` ${todo('숫자')}`}</dd></div>
    <div><dt>Links</dt><dd><p class="btn-row">${f.links.map((l) => btn(`${l.label} ↗`, l.url, { solid: true })).join('')}${btn('Demo', null)}</p><p class="muted">${esc(f.noDemoNote)}</p></dd></div>
  </dl>
  <p class="why">💡 ${esc(c.en.featuredWhy)}</p>`;
}

export function projectCard(pr) {
  return `
  <article class="locker-card${pr.live ? ' is-live' : ''}" id="project-${esc(pr.id)}">
    ${pr.live ? '<span class="live-sticker">LIVE</span>' : ''}
    <p class="meta">${esc(pr.period)} · ${esc(pr.team)} · ${esc(pr.role)}</p>
    <h3>${esc(pr.title)} <span class="sub">${esc(pr.subtitle)}</span></h3>
    <p>${esc(pr.summary)}</p>
    <p class="proof">${esc(pr.proof)}</p>
    ${chips(pr.stack)}
    <p class="btn-row">${pr.links.map((l) => btn(`${l.label} ↗`, l.url)).join('')}</p>
  </article>`;
}

export function toolkitPanel(t) {
  return `
  ${viewTag('🧺', 'toolkit · trophy case')}
  <h2>The trophy case</h2>
  <div class="shelves">
    ${t.shelves.map((s) => `<div class="shelf"><p class="label">${esc(s.name)}</p>${chips(s.items, 'chip chip-badge')}</div>`).join('')}
  </div>
  <p class="trophy">🏆 ${esc(t.trophy)}</p>`;
}

export function yearbookPanel(tl, c) {
  return `
  ${viewTag('🌙', 'back view · where I came from')}
  <h2>The yearbook</h2>
  <ol class="yearbook">
    ${tl.map((pg) => `
    <li class="yb-page">
      <p class="yb-when">${esc(pg.when)}</p>
      <h3>${esc(pg.title)}</h3>
      ${pg.superlative ? `<p class="superlative">${esc(c.en.superlative)}</p>` : ''}
      ${pg.body ? `<p>${esc(pg.body)}</p>` : ''}
      ${pg.badges ? chips(pg.badges, 'chip chip-lav') : ''}
      ${pg.llmLine ? `<p class="hand-line">${esc(c.en.llmLine)}</p>` : ''}
    </li>`).join('')}
    <li class="yb-page yb-doodles" aria-label="signatures page">
      <p class="doodle d1">Stay curious! — future me</p>
      <p class="doodle d2">HAGS ♡</p>
    </li>
  </ol>`;
}

export function hallPassPanel(p, c) {
  return `
  ${viewTag('💌', 'hall pass · say hi')}
  <div class="hallpass">
    <p class="hp-title">HALL PASS</p>
    <dl>
      <div><dt>Name</dt><dd>${esc(p.name)}</dd></div>
      <div><dt>Destination</dt><dd>your team</dd></div>
      <div><dt>Time</dt><dd>anytime</dd></div>
    </dl>
  </div>
  <p class="btn-row">
    ${btn('⬇ Download Resume (PDF)', p.links.resume, { solid: true, download: 'Sohee-An-resume.pdf' })}
    ${btn('GitHub ↗', p.links.github)}
    ${btn('Velog ↗', p.links.velog)}
    ${btn('Naver Blog ↗', p.links.naver)}
    ${btn(`✉ ${p.links.email}`, `mailto:${p.links.email}`)}
  </p>`;
}

/* ---------- whole flat page ---------- */
export function renderFlat({ profile: p, copy: c, projects, research, toolkit, timeline }) {
  const featured = projects.find((x) => x.featured);
  const others = projects.filter((x) => !x.featured);
  return `
  <section class="hero" id="top">
    <figure class="polaroid hero-polaroid">
      <img src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="800" height="1040" fetchpriority="high" />
      <figcaption>${esc(p.name)} · ${esc(p.handle)}</figcaption>
    </figure>
    <div class="hero-text">
      <p class="hero-q">${esc(c.en.question)}</p>
      <h1>${esc(p.name)} <span class="hero-handle">@${esc(p.handle)}</span></h1>
      <p class="hero-tagline">${esc(c.en.tagline)}</p>
      <p class="hero-ko" lang="ko">${esc(c.ko.tagline)}</p>
      ${chips(p.interests.map((t) => `♡ ${t}`), 'chip chip-pink')}
      <p class="btn-row">
        ${btn('GitHub ↗', p.links.github, { solid: true })}
        ${btn('⬇ Resume (PDF)', p.links.resume, { download: 'Sohee-An-resume.pdf' })}
        ${btn(`✉ ${p.links.email}`, `mailto:${p.links.email}`)}
      </p>
    </div>
  </section>

  <section class="panel tint-sky" id="front">${aboutPanel(p, c)}</section>
  <section class="panel tint-lav" id="side">${researchPanel(research, c, p)}</section>
  <section class="panel tint-pink" id="lockers">${featuredPanel(featured, c)}</section>
  <section class="panel tint-cream" id="more-projects">
    ${viewTag('🔒', 'lockers · more projects')}
    <h2>More lockers</h2>
    <div class="locker-grid">${others.map(projectCard).join('')}</div>
  </section>
  <section class="panel tint-sage" id="toolkit">${toolkitPanel(toolkit)}</section>
  <section class="panel tint-peach" id="back">${yearbookPanel(timeline, c)}</section>
  <section class="panel tint-pink" id="hallpass">${hallPassPanel(p, c)}<p class="ending">${esc(c.en.ending)}</p></section>`;
}
