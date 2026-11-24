// Renders src/content/*.json to HTML strings.
// Used at build time for the 2D page (index.html, readable without JS) and at runtime
// for the 3D panels, so every piece of text lives in exactly one place.
// Anything that is null/empty in the JSON is simply not rendered.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

export function btn(label, url, { solid = false, download } = {}) {
  if (!url) return '';
  const attrs = download
    ? `href="${esc(url)}" download="${esc(download)}"`
    : url.startsWith('mailto:') ? `href="${esc(url)}"` : `href="${esc(url)}" target="_blank" rel="noopener"`;
  return `<a class="btn${solid ? ' btn-solid' : ''}" ${attrs}>${esc(label)}</a>`;
}
const chips = (items, cls = 'chip') => (items && items.length ? `<ul class="chips">${items.map((t) => `<li class="${cls}">${esc(t)}</li>`).join('')}</ul>` : '');
const kicker = (t) => `<p class="kicker">${esc(t)}</p>`;
const list = (items) => (items && items.length ? `<ul>${items.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : '');
const RESUME = (p) => btn('이력서 PDF', p.links.resume, { download: '안소희-이력서.pdf' });

/** node labels in data-flow order (used by the 3D sculptures too) */
export function flowText(pr) {
  const label = Object.fromEntries(pr.nodes.map((n) => [n.id, n.label]));
  const order = [];
  const seen = new Set();
  const visit = (id) => { if (seen.has(id)) return; seen.add(id); order.push(id); pr.edges.filter(([a]) => a === id).forEach(([, b]) => visit(b)); };
  const incoming = new Set(pr.edges.map(([, b]) => b));
  pr.nodes.filter((n) => !incoming.has(n.id)).forEach((n) => visit(n.id));
  return order.map((id) => label[id]);
}
const flowSentence = (pr) => `데이터는 ${flowText(pr).map(esc).join(', ')} 순서로 흐릅니다.`;
const mineSentence = (pr) => {
  const mine = pr.nodes.filter((n) => n.mine).map((n) => esc(n.label));
  return mine.length ? `<p class="mine">제가 맡은 부분: ${mine.join(', ')}</p>` : '';
};
const row = (dt, dd) => (dd ? `<div><dt>${dt}</dt><dd>${dd}</dd></div>` : '');
const meta = (pr) => [pr.period, pr.team, pr.role].filter(Boolean).map(esc).join(', ');
const links = (pr) => {
  const b = pr.links.map((l, i) => btn(`${l.label} ↗`, l.url, { solid: i === 0 })).join('');
  return b || pr.linkNote ? `<p class="btn-row">${b}</p>${pr.linkNote ? `<p class="muted">${esc(pr.linkNote)}</p>` : ''}` : '';
};

/* ---------- shared blocks ---------- */
function interestBlock(p, r) {
  return `
  <div class="question"><p class="label">큰 질문</p><p class="q-text">${esc(p.question)}</p></div>
  ${r.angle ? `<div class="question"><p class="label">내 생각</p><p class="q-angle">${esc(r.angle)}</p></div>` : ''}
  <dl class="now-next">
    ${p.now ? `<div><dt>NOW</dt><dd>${esc(p.now)}</dd></div>` : ''}
    ${p.next && p.next.length ? `<div><dt>NEXT</dt><dd>${list(p.next)}</dd></div>` : ''}
  </dl>`;
}

function activityList(r) {
  if (!r.activities || !r.activities.length) return '';
  return `<ol class="timeline">${r.activities.map((a) => `
    <li><span class="cv-when">${esc(a.date)}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.body)}</p>${a.url ? btn('자료 보기 ↗', a.url) : ''}</div></li>`).join('')}</ol>`;
}

function paperBoard(r) {
  return `
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
  ${r.nowLearning && r.nowLearning.length ? `<p class="label">지금 공부 중</p>${chips(r.nowLearning, 'chip chip-soft')}` : ''}`;
}

function skillList(s) {
  return `<dl class="cv-skills">${s.rows.map((r) => `<div><dt>${esc(r.name)}</dt><dd>${r.items.map(esc).join(', ')}<small>${esc(r.where)}</small></dd></div>`).join('')}
    ${s.llmUse ? `<div><dt>${esc(s.llmUse.name)}</dt><dd>${esc(s.llmUse.text)}<small>${esc(s.llmUse.where)}</small></dd></div>` : ''}</dl>`;
}

/* ---------- 3D panels ---------- */
export function helloPanel(p, c, r) {
  return `
  ${kicker('HELLO')}
  <div class="hello">
    <figure class="polaroid hello-photo">
      <img src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="800" height="1040" loading="lazy" />
      <figcaption>${esc(p.nameKo)}, ${esc(p.handle)}</figcaption>
    </figure>
    <div>
      <h2>${esc(p.nameKo)} <span class="sub">${esc(p.name)}, 닉네임 ${esc(p.handle)}</span></h2>
      <ul class="lines">${p.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    </div>
  </div>
  <p class="headline">${esc(p.headline)}</p>
  <p class="lead">${esc(c.about)}</p>
  ${chips(p.interests, 'chip chip-accent')}
  ${r ? interestBlock(p, r) : ''}
  <p class="btn-row">${btn('GitHub ↗', p.links.github, { solid: true })}${btn('PNU CV Lab ↗', p.links.lab)}${btn('Velog ↗', p.links.velog)}</p>`;
}

export function researchPanel(r) {
  return `
  ${kicker('RESEARCH')}
  <h2>공부하고 있는 문제</h2>
  <p class="lead">${esc(r.problem)}</p>
  <blockquote class="pull">${esc(r.angle)}<span lang="en">${esc(r.angleEn)}</span></blockquote>
  <p class="muted">${esc(r.status)}</p>
  ${r.activities && r.activities.length ? `<p class="label">발표와 세미나</p>${activityList(r)}` : ''}
  ${paperBoard(r)}`;
}

export function projectPanel(pr) {
  return `
  ${kicker(pr.featured ? '대표 프로젝트' : 'SYSTEMS')}
  <h2>${esc(pr.title)}${pr.live ? ' <span class="live">LIVE</span>' : ''} <span class="sub">${esc(pr.subtitle)}</span></h2>
  <p class="meta">${meta(pr)}</p>
  <dl class="case">
    ${row('문제 정의', esc(pr.problem))}
    ${row('구조', `<p>${flowSentence(pr)}</p>${mineSentence(pr)}`)}
    ${row('내가 한 일', list(pr.did))}
    ${row('기술적 결정', list(pr.decisions))}
    ${row('결과', esc(pr.result))}
    ${row('아쉬운 점', pr.lesson ? esc(pr.lesson) : '')}
    ${row('기술 스택', chips(pr.stack))}
    ${row('링크', links(pr))}
  </dl>`;
}

export function stackPanel(s) {
  return `
  ${kicker('STACK')}
  <h2>기술 스택</h2>
  ${skillList(s)}`;
}

export function contactPanel(p) {
  return `
  ${kicker('NEXT STOP')}
  <h2>연락처와 이력서</h2>
  <p class="btn-row">
    ${btn('이력서 PDF 내려받기', p.links.resume, { solid: true, download: '안소희-이력서.pdf' })}
    ${btn(p.links.email, `mailto:${p.links.email}`)}
    ${btn('GitHub ↗', p.links.github)}
    ${btn('Velog ↗', p.links.velog)}
  </p>`;
}

/* ---------- 2D page (default) ---------- */
const sec = (id, num, title, body) => `
  <section class="r-sec" id="${id}">
    <h2 class="r-title"><span class="r-num">${num}</span>${esc(title)}</h2>
    ${body}
  </section>`;

function featuredBlock(pr) {
  return `
  <article class="feat">
    <p class="feat-label">대표 프로젝트</p>
    <h3 class="feat-title">${esc(pr.title)}${pr.live ? ' <span class="live">LIVE</span>' : ''} <span class="proj-sub">${esc(pr.subtitle)}</span></h3>
    ${pr.summary ? `<p class="feat-sum">${esc(pr.summary)}</p>` : ''}
    <p class="proj-meta">${meta(pr)}</p>
    <p class="proj-stack">${esc(pr.stack.join(', '))}</p>
    ${pr.screenshot ? `<img class="feat-shot" src="${esc(pr.screenshot)}" alt="${esc(pr.screenshotAlt || pr.title + ' 화면')}" width="1532" height="420" loading="lazy" />` : ''}
    <dl class="case case-flat">
      ${row('문제 정의', esc(pr.problem))}
      ${row('내가 한 일과 이유', list(pr.did))}
      ${row('결과', esc(pr.result))}
      ${row('아쉬운 점', pr.lesson ? esc(pr.lesson) : '')}
    </dl>
    ${links(pr)}
  </article>`;
}

function projectCard(pr) {
  return `
  <article class="proj" id="project-${esc(pr.id)}">
    <h3 class="proj-head">${esc(pr.title)}${pr.live ? ' <span class="live">LIVE</span>' : ''}</h3>
    <p class="proj-sub">${esc(pr.subtitle)}</p>
    <p class="proj-meta">${meta(pr)}</p>
    <p class="proj-label">내가 한 일</p>
    ${list(pr.cardDid || pr.decisions.slice(0, 2))}
    <p class="proj-label">결과</p>
    <p class="proj-result">${esc(pr.cardResult || pr.result)}</p>
    ${links(pr)}
  </article>`;
}

const cvList = (items) => `<ul class="cv-list">${items.map((e) => `<li><span class="cv-when">${esc(e.period || '')}</span><div><strong>${esc(e.title)}</strong>${e.note ? `<p>${esc(e.note)}</p>` : ''}${e.items ? list(e.items) : ''}</div></li>`).join('')}</ul>`;

export function renderFlat({ profile: p, copy: c, projects, research: r, stack, resume }) {
  const featured = projects.find((x) => x.featured);
  const others = projects.filter((x) => !x.featured);
  return `
  <section class="r-sec r-hero" id="top">
    <h2 class="r-title"><span class="r-num">00</span>소개</h2>
    <div class="r-hero-grid">
      <div>
        <h1>${esc(p.nameKo)} <span class="r-en">${esc(p.name)}, ${esc(p.handle)}</span></h1>
        <p class="r-tagline">${esc(p.tagline)}</p>
        <ul class="lines">${p.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
        <p class="r-headline">${esc(p.headline)}</p>
        <p class="lead">${esc(c.about)}</p>
        <p class="btn-row">
          ${btn('GitHub ↗', p.links.github, { solid: true })}
          ${btn(p.links.email, `mailto:${p.links.email}`)}
          ${RESUME(p)}
        </p>
      </div>
      <figure class="polaroid r-photo">
        <img src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="800" height="1040" fetchpriority="high" />
        <figcaption>${esc(p.nameKo)}, ${esc(p.handle)}</figcaption>
      </figure>
    </div>
  </section>
  ${sec('research', '01', '연구', `
    ${chips(p.interests, 'chip chip-accent')}
    ${interestBlock(p, r)}
    ${r.activities && r.activities.length ? `<p class="label">발표와 세미나</p>${activityList(r)}` : ''}
    <p class="r-status">${esc(r.status)}</p>
    ${paperBoard(r)}`)}
  ${sec('projects', '02', '프로젝트', `${featuredBlock(featured)}<div class="proj-grid">${others.map(projectCard).join('')}</div>`)}
  ${sec('resume', '03', '이력', `
    <div class="cv">
      <div class="cv-row"><h3>학력</h3>${cvList(resume.education)}</div>
      ${resume.research && resume.research.length ? `<div class="cv-row"><h3>연구</h3>${cvList(resume.research)}</div>` : ''}
      <div class="cv-row"><h3>활동</h3>${cvList(resume.activities)}</div>
      <div class="cv-row"><h3>기술</h3>${skillList(stack)}</div>
    </div>
    <h3 class="contact-h">연락처</h3>
    <p class="btn-row">${btn('GitHub ↗', p.links.github, { solid: true })}${btn(p.links.email, `mailto:${p.links.email}`)}${RESUME(p)}${btn('Velog ↗', p.links.velog)}${btn('PNU CV Lab ↗', p.links.lab)}<a class="btn" href="/3d.html">3D 버전 보기</a></p>`)}
  <p class="ending">${esc(c.ending)}</p>`;
}
