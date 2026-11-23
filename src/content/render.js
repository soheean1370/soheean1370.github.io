// Renders the portfolio content (src/content/*.json) to HTML strings.
// Used at build time for flat.html (static, readable without JS) and at runtime for the 3D panels,
// so every piece of text lives in exactly one place.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const todo = (what) => `<span class="todo">[확인 필요${what ? `: ${esc(what)}` : ''}]</span>`;

export function btn(label, url, { solid = false, download, icon = '' } = {}) {
  if (!url) return `<span class="btn is-todo" aria-disabled="true">${icon}${esc(label)} <small>준비 중</small></span>`;
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
          <p class="idcard-name">${esc(p.nameKo)} <span lang="en">${esc(p.name)}</span></p>
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
  ${viewTag('🍡', '앞모습 · 내 락커 #1370')}
  <h2>안녕하세요, 소희예요.</h2>
  ${idCard(p)}
  <p class="lead">${esc(c.ko.about)}</p>
  <p class="label">관심 분야</p>
  ${chips(p.interests.map((t) => `♡ ${t}`), 'chip chip-pink')}
  <p class="btn-row">${btn('GitHub ↗', p.links.github)}${btn('PNU CV Lab ↗', p.links.lab)}</p>`;
}

export function researchPanel(r, c, p) {
  return `
  ${viewTag('☁', '옆모습 · 연구')}
  <h2>${esc(r.center)}</h2>
  <blockquote class="pull">${esc(c.ko.researchQuestion)}<span>${esc(c.ko.researchDetail)}</span></blockquote>
  <p class="muted">${esc(r.surveyNote)}</p>
  <div class="board">
    ${r.groups.map((g) => `
    <article class="pin-card">
      <p class="pin-kind"><span class="pin-id">${esc(g.id)}</span> ${esc(g.kind)}</p>
      <h3>${esc(g.title)}</h3>
      <ul class="papers">${g.papers.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="pro">＋ 잘하는 것: ${esc(g.good)}</p>
      <p class="con">－ 아쉬운 것: ${esc(g.bad)}</p>
    </article>`).join('')}
  </div>
  <p class="label">🌱 지금 공부 중</p>
  ${chips(p.nowLearning, 'chip chip-sage')}
  <p class="btn-row">${btn('Velog 정리 노트 ↗', p.links.velog)}</p>`;
}

export function featuredPanel(f, c) {
  return `
  ${viewTag('🔒', '락커 · 대표 프로젝트')}
  <h2>${esc(f.title)} <span class="sub">— ${esc(f.subtitle)}</span></h2>
  <p class="meta">${esc(f.period)} · ${esc(f.team)}</p>
  <dl class="case">
    <div><dt>문제 정의</dt><dd>${esc(f.problem)}</dd></div>
    <div><dt>내 역할</dt><dd>${esc(f.role)}</dd></div>
    <div><dt>만든 것</dt><dd>
      <ol class="flow" aria-label="파이프라인">${f.flow.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <ul>${f.built.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    </dd></div>
    <div><dt>기술</dt><dd>${chips(f.stack)}</dd></div>
    <div><dt>결과</dt><dd>${esc(f.result)}${f.resultNumbers ? ` ${esc(f.resultNumbers)}` : ` ${todo('숫자')}`}</dd></div>
    <div><dt>링크</dt><dd><p class="btn-row">${f.links.map((l) => btn(`${l.label} ↗`, l.url, { solid: true })).join('')}${btn('데모', null)}</p><p class="muted">${esc(f.noDemoNote)}</p></dd></div>
  </dl>
  <p class="why">💡 ${esc(c.ko.featuredWhy)}</p>`;
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
  ${viewTag('🧺', '도구함 · 트로피 진열장')}
  <h2>트로피 대신, 기술 배지</h2>
  <div class="shelves">
    ${t.shelves.map((s) => `<div class="shelf"><p class="label">${esc(s.name)}</p>${chips(s.items, 'chip chip-badge')}</div>`).join('')}
  </div>
  <p class="trophy">🏆 ${esc(t.trophy)}</p>`;
}

export function yearbookPanel(tl, c) {
  return `
  ${viewTag('🌙', '뒷모습 · 내가 지나온 길')}
  <h2>졸업앨범</h2>
  <ol class="yearbook">
    ${tl.map((pg) => `
    <li class="yb-page">
      <p class="yb-when">${esc(pg.when)}</p>
      <h3>${esc(pg.title)}</h3>
      ${pg.superlative ? `<p class="superlative" lang="en">${esc(c.en.superlative)}</p><p class="superlative-ko">${esc(c.ko.superlative)}</p>` : ''}
      ${pg.body ? `<p>${esc(pg.body)}</p>` : ''}
      ${pg.badges ? chips(pg.badges, 'chip chip-lav') : ''}
      ${pg.llmLine ? `<p class="hand-line">${esc(c.ko.llmLine)}</p>` : ''}
    </li>`).join('')}
    <li class="yb-page yb-doodles" aria-label="낙서 페이지">
      <p class="doodle d1">늘 궁금해하기! — 미래의 나</p>
      <p class="doodle d2">HAGS ♡ <small>(Have A Great Summer)</small></p>
    </li>
  </ol>`;
}

export function hallPassPanel(p, c) {
  return `
  ${viewTag('💌', '복도 통행증 · 연락하기')}
  <div class="hallpass">
    <p class="hp-title">HALL PASS · 복도 통행증</p>
    <dl>
      <div><dt>이름</dt><dd>${esc(p.nameKo)} (${esc(p.name)})</dd></div>
      <div><dt>목적지</dt><dd>당신의 팀</dd></div>
      <div><dt>시간</dt><dd>언제든지</dd></div>
    </dl>
  </div>
  <p class="btn-row">
    ${btn('⬇ 이력서 다운로드 (PDF)', p.links.resume, { solid: true, download: '안소희-이력서.pdf' })}
    ${btn('GitHub ↗', p.links.github)}
    ${btn('Velog ↗', p.links.velog)}
    ${btn('네이버 블로그 ↗', p.links.naver)}
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
      <p class="hero-q">${esc(c.ko.question)}</p>
      <h1>${esc(p.nameKo)} <span class="hero-handle">@${esc(p.handle)}</span></h1>
      <p class="hero-tagline">${esc(c.ko.tagline)}</p>
      <p class="hero-ko" lang="en">${esc(c.en.tagline)}</p>
      ${chips(p.interests.map((t) => `♡ ${t}`), 'chip chip-pink')}
      <p class="btn-row">
        ${btn('GitHub ↗', p.links.github, { solid: true })}
        ${btn('⬇ 이력서 (PDF)', p.links.resume, { download: '안소희-이력서.pdf' })}
        ${btn(`✉ ${p.links.email}`, `mailto:${p.links.email}`)}
      </p>
    </div>
  </section>

  <section class="panel tint-sky" id="front">${aboutPanel(p, c)}</section>
  <section class="panel tint-lav" id="side">${researchPanel(research, c, p)}</section>
  <section class="panel tint-pink" id="lockers">${featuredPanel(featured, c)}</section>
  <section class="panel tint-cream" id="more-projects">
    ${viewTag('🔒', '락커 · 다른 프로젝트')}
    <h2>다른 락커들</h2>
    <div class="locker-grid">${others.map(projectCard).join('')}</div>
  </section>
  <section class="panel tint-sage" id="toolkit">${toolkitPanel(toolkit)}</section>
  <section class="panel tint-peach" id="back">${yearbookPanel(timeline, c)}</section>
  <section class="panel tint-pink" id="hallpass">${hallPassPanel(p, c)}<p class="ending">${esc(c.ko.ending)}</p></section>`;
}
