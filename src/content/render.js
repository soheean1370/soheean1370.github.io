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

/* ---------- 2D page (default): desk / scrapbook look ---------- */
const PROJECT_ORDER = ['qroom', 'withpnu', 'eatwise', 'farmforyou', 'review-stars'];
const DOTS = '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>';
const CLIP = '<svg class="clip" viewBox="0 0 24 64" aria-hidden="true"><path d="M8 18v30a6 6 0 0 0 12 0V12a9 9 0 0 0-18 0v38a12 12 0 0 0 24 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const CURSOR = '<svg class="cursor" viewBox="0 0 12 19" aria-hidden="true" shape-rendering="crispEdges"><path d="M0 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H7v1h1v1h1v2H8v1H6v-1H5v-2H4v-1H3v1H2v1H1v1H0z" fill="#3E3550"/><path d="M1 2h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H6v1h1v1h1v2H7v-2H6v-2H5v-1H4v1H3v1H2v1H1z" fill="#fff"/></svg>';
const win = (title, body, cls = '') => `
  <div class="win ${cls}">
    <div class="win-bar">${DOTS}<span class="win-title">${esc(title)}</span></div>
    <div class="win-body">${body}</div>
  </div>`;
const ctxMenu = (pr) => {
  const items = pr.links.filter((l) => l.url).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} 열기 <span aria-hidden="true">↗</span></a>`).join('');
  return items || pr.linkNote ? `<div class="ctx" role="group" aria-label="${esc(pr.title)} 링크">${items}${pr.linkNote ? `<p class="ctx-note">${esc(pr.linkNote)}</p>` : ''}</div>` : '';
};
const fileIcon = '<span class="ficon" aria-hidden="true"></span>';

function deskFeatured(pr) {
  return `
  <article class="feat">
    <div class="feat-head">
      ${fileIcon}
      <div>
        <p class="tagline-s">대표 프로젝트</p>
        <h3>${esc(pr.title)} <span class="sub">${esc(pr.subtitle)}</span></h3>
      </div>
    </div>
    ${pr.summary ? `<p class="feat-sum">${esc(pr.summary)}</p>` : ''}
    <p class="meta">${meta(pr)}</p>
    <p class="stackline">${esc(pr.stack.join(', '))}</p>
    ${pr.screenshot ? `
    <figure class="preview">
      <div class="win-bar">${DOTS}<span class="win-title">${esc(pr.screenshot.split('/').pop())}</span></div>
      <picture>${pr.screenshotMobile ? `<source media="(max-width: 640px)" srcset="${esc(pr.screenshotMobile)}" width="460" height="302" />` : ''}<img src="${esc(pr.screenshot)}" alt="${esc(pr.screenshotAlt || pr.title + ' 화면')}" width="1532" height="420" loading="lazy" /></picture>
    </figure>` : ''}
    <dl class="info">
      ${row('문제 정의', esc(pr.problem))}
      ${row('내가 한 일과 이유', list(pr.did))}
      ${row('결과', esc(pr.result))}
      ${row('아쉬운 점', pr.lesson ? esc(pr.lesson) : '')}
    </dl>
    ${ctxMenu(pr)}
  </article>`;
}

function deskCard(pr) {
  const badge = pr.live ? '<span class="badge badge-live">LIVE</span>' : /장려상/.test(pr.result + (pr.cardResult || '')) ? '<span class="badge">장려상</span>' : '';
  return `
  <article class="file" id="project-${esc(pr.id)}">
    <div class="file-head">${fileIcon}<h3><span class="file-name">${esc(pr.title)}</span></h3>${badge}</div>
    <p class="file-sub">${esc(pr.subtitle)}</p>
    <p class="meta">${meta(pr)}</p>
    <p class="mini">내가 한 일</p>
    ${list(pr.cardDid || pr.decisions.slice(0, 2))}
    <p class="mini">결과</p>
    <p class="file-result">${esc(pr.cardResult || pr.result)}</p>
    ${ctxMenu(pr)}
  </article>`;
}

const TAG_COLORS = ['#FF6B6B', '#B58BE0', '#4C9AFF'];
const giList = (items) => `<ul class="gi-list">${items.map((e) => `<li><span class="gi-when">${esc(e.period || '')}</span><div><strong>${esc(e.title)}</strong>${e.note ? `<p>${esc(e.note)}</p>` : ''}${e.items ? list(e.items) : ''}</div></li>`).join('')}</ul>`;
const giGroup = (title, body) => `<div class="gi-group"><h3><span class="tri" aria-hidden="true"></span>${esc(title)}</h3>${body}</div>`;

export function renderFlat({ profile: p, copy: c, projects, research: r, stack, resume }) {
  const featured = projects.find((x) => x.featured);
  const others = projects.filter((x) => !x.featured)
    .sort((a, b) => PROJECT_ORDER.indexOf(a.id) - PROJECT_ORDER.indexOf(b.id));
  const share = [
    ['mail', '메일', `mailto:${p.links.email}`, p.links.email],
    ['gh', 'GitHub', p.links.github, `@${p.handle}`],
    ['velog', 'Velog', p.links.velog, '블로그'],
    ['lab', 'PNU CV Lab', p.links.lab, '연구실'],
    ['three', '3D 버전', '/3d.html', '사진 한 장이 3D 캠퍼스가 되는 버전'],
  ].filter(([, , u]) => u);
  return `
  <section class="desk" id="top" aria-labelledby="t-hello">
    <h2 class="sr-only" id="t-hello">00 소개</h2>
    <div class="desk-grid">
      <div class="folder">
        <span class="folder-tab">00_소개</span>
        <div class="folder-body"><div class="folder-paper">
          <p class="pixel">PORTFOLIO 2026</p>
          <h1>${esc(p.nameKo)} <span class="en">${esc(p.name)}, ${esc(p.handle)}</span></h1>
          <p class="tagline">${esc(p.tagline)}</p>
          <p class="school">${p.lines.map(esc).join('<br />')}</p>
          <p class="about">${esc(c.about)}</p>
          <p class="btn-row">
            ${btn('GitHub ↗', p.links.github, { solid: true })}
            ${btn(p.links.email, `mailto:${p.links.email}`)}
            ${RESUME(p)}
          </p>
        </div></div>
        <div class="note">${CLIP}<p>${esc(p.headline)}</p></div>
      </div>
      <div class="lanyard">
        <span class="strap" aria-hidden="true"></span>
        <span class="hook" aria-hidden="true"></span>
        <article class="idcard" aria-label="학생증 모양 프로필 카드">
          <header><span>STUDENT ID</span><span>PNU</span></header>
          <div class="id-body">
            <img src="${esc(p.photo)}" alt="${esc(p.photoAlt)}" width="800" height="1040" fetchpriority="high" />
            <dl>
              <div><dt>NAME</dt><dd>${esc(p.nameKo)}</dd></div>
              <div><dt>NICKNAME</dt><dd>${esc(p.handle)}</dd></div>
              <div><dt>DEPT</dt><dd>정보컴퓨터공학부</dd></div>
              <div><dt>LAB</dt><dd>PNU CV Lab</dd></div>
            </dl>
          </div>
          <div class="barcode" aria-hidden="true"></div>
        </article>
        ${CURSOR}
      </div>
    </div>
  </section>

  <section class="r-sec" id="projects" aria-labelledby="t-projects">
    <h2 class="sec-label" id="t-projects"><span class="ficon ficon-s" aria-hidden="true"></span>01_프로젝트</h2>
    ${win('01_프로젝트', `${deskFeatured(featured)}<div class="files">${others.map(deskCard).join('')}</div>`, 'win-projects')}
  </section>

  <section class="r-sec" id="research" aria-labelledby="t-research">
    <h2 class="sec-label" id="t-research"><span class="ficon ficon-s" aria-hidden="true"></span>02_연구</h2>
    <div class="paper">
      ${CLIP}
      <ul class="tags">${p.interests.map((t, i) => `<li><i style="background:${TAG_COLORS[i % TAG_COLORS.length]}"></i>${esc(t)}</li>`).join('')}</ul>
      <p class="mini">큰 질문</p>
      <p class="q">${esc(p.question)}</p>
      ${r.angle ? `<p class="mini">내 생각</p><p class="angle">${esc(r.angle)}</p>` : ''}
      ${p.now ? `<p class="mini">NOW</p><p>${esc(p.now)}</p>` : ''}
      ${p.next && p.next.length ? `<p class="mini">NEXT</p><ul class="todo-list">${p.next.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="status">${esc(r.status)}</p>
    </div>
  </section>

  <section class="r-sec" id="resume" aria-labelledby="t-resume">
    <h2 class="sec-label" id="t-resume"><span class="ficon ficon-s" aria-hidden="true"></span>03_이력</h2>
    ${win(`${p.handle} 정보`, `
      <div class="gi-top">${fileIcon}<div><strong>${esc(p.nameKo)}</strong><p>이력, 2023년부터</p></div></div>
      ${giGroup('학력', giList(resume.education))}
      ${resume.research && resume.research.length ? giGroup('연구', giList(resume.research)) : ''}
      ${giGroup('활동', giList(resume.activities))}
      ${giGroup('기술', skillList(stack))}`, 'win-info')}
    <div class="share">
      <div class="airdrop" role="group" aria-label="이력서 받기">
        <p class="ad-title">AirDrop</p>
        <p>${esc(p.handle)} 님이 이력서 PDF를 보내려고 합니다.</p>
        <div class="ad-btns"><a href="mailto:${esc(p.links.email)}">메일 보내기</a><a href="${esc(p.links.resume)}" download="안소희-이력서.pdf">받기</a></div>
        ${CURSOR}
      </div>
      <ul class="sharelist" aria-label="연락처">${share.map(([k, label, url, sub]) => `
        <li><a href="${esc(url)}"${url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><span class="si si-${k}" aria-hidden="true"></span><span><strong>${esc(label)}</strong><small>${esc(sub)}</small></span></a></li>`).join('')}
      </ul>
    </div>
  </section>
  <p class="ending">${esc(c.ending)}</p>`;
}
