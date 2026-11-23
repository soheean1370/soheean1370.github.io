/* Soheean High: Hallway Pass — hallway engine (no dependencies) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const body = document.body;
  const world = $('#world');
  const viewport = $('#viewport');
  const player = $('#player');
  const sheet = $('#sheet');
  const sheetBody = $('#sheetBody');
  const btnSkip = $('#btnSkip');
  const tcAct = $('#tcAct');
  const minimapDot = $('#minimapDot');
  const stations = $$('.station');

  const WORLD_W = world.offsetWidth || 4300;
  const MIN_X = 80, MAX_X = WORLD_W - 80;
  const SPEED = 380;         // px per second
  const REACH = 90;          // how close you must be to open something

  const state = {
    x: 300,
    left: false,
    right: false,
    target: null,            // { x, station } when auto-walking after a click/tap
    near: null,
    last: 0,
  };

  /* ---------- modes ---------- */
  body.classList.remove('no-js');
  const startInPage = location.hash === '#portfolio' || new URLSearchParams(location.search).has('skip');
  setMode(startInPage ? 'page' : 'game');
  if (!startInPage) $('#btnEnter').focus();

  function setMode(mode) {
    body.classList.toggle('mode-game', mode === 'game');
    body.classList.toggle('mode-page', mode === 'page');
    btnSkip.setAttribute('aria-pressed', String(mode === 'page'));
    if (mode === 'page') {
      if (sheet.open) sheet.close();
      window.scrollTo(0, 0);
      $('#portfolio').focus({ preventScroll: true });
    }
  }

  btnSkip.addEventListener('click', () => {
    const toPage = body.classList.contains('mode-game');
    setMode(toPage ? 'page' : 'game');
    history.replaceState(null, '', toPage ? '#portfolio' : location.pathname);
  });

  $('#btnEnter').addEventListener('click', () => {
    body.classList.add('intro-done');
    viewport.focus?.();
  });

  /* ---------- opening a station ---------- */
  function openStation(st) {
    const src = document.getElementById(st.dataset.open);
    if (!src) return;
    state.left = state.right = false;
    state.target = null;
    const clone = src.cloneNode(true);
    clone.removeAttribute('id');
    $$('[id]', clone).forEach((n) => n.removeAttribute('id'));
    const h = $('h2', clone);
    if (h) h.id = 'sheetTitle';
    sheetBody.replaceChildren(clone);
    sheet.showModal();
    sheetBody.scrollTop = 0;
  }
  $('#sheetClose').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); }); // backdrop click

  stations.forEach((st) => {
    st.addEventListener('click', () => {
      const sx = Number(st.dataset.x);
      if (Math.abs(sx - state.x) <= REACH) openStation(st);
      else state.target = { x: sx, station: st };   // walk there, then open
    });
  });

  /* ---------- input ---------- */
  const LEFT = new Set(['ArrowLeft', 'a', 'A']);
  const RIGHT = new Set(['ArrowRight', 'd', 'D']);
  const inGame = () => body.classList.contains('mode-game') && body.classList.contains('intro-done') && !sheet.open;

  window.addEventListener('keydown', (e) => {
    if (!inGame()) return;
    if (LEFT.has(e.key)) { state.left = true; state.target = null; e.preventDefault(); }
    else if (RIGHT.has(e.key)) { state.right = true; state.target = null; e.preventDefault(); }
    else if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button, a')) {
      if (state.near) { e.preventDefault(); openStation(state.near); }
    }
  });
  window.addEventListener('keyup', (e) => {
    if (LEFT.has(e.key)) state.left = false;
    if (RIGHT.has(e.key)) state.right = false;
  });
  window.addEventListener('blur', () => { state.left = state.right = false; });

  function holdButton(el, key) {
    const on = (e) => { e.preventDefault(); state[key] = true; state.target = null; el.classList.add('pressed'); el.setPointerCapture?.(e.pointerId); };
    const off = () => { state[key] = false; el.classList.remove('pressed'); };
    el.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => el.addEventListener(t, off));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  holdButton($('#tcLeft'), 'left');
  holdButton($('#tcRight'), 'right');
  tcAct.addEventListener('click', () => { if (state.near) openStation(state.near); });

  /* ---------- loop ---------- */
  let cam = 0;
  function frame(t) {
    const dt = Math.min((t - (state.last || t)) / 1000, 0.05);
    state.last = t;

    let dir = 0;
    if (inGame()) {
      if (state.target) {
        const d = state.target.x - state.x;
        if (Math.abs(d) < 6) {
          const st = state.target.station;
          state.target = null;
          state.x = Number(st.dataset.x);
          openStation(st);
        } else dir = Math.sign(d);
      } else {
        dir = (state.right ? 1 : 0) - (state.left ? 1 : 0);
      }
    }
    if (dir) {
      state.x = Math.max(MIN_X, Math.min(MAX_X, state.x + dir * SPEED * dt));
      player.classList.toggle('face-left', dir < 0);
    }
    player.classList.toggle('walking', dir !== 0);

    // nearest station within reach
    let near = null, best = REACH;
    for (const st of stations) {
      const d = Math.abs(Number(st.dataset.x) - state.x);
      if (d <= best) { best = d; near = st; }
    }
    if (near !== state.near) {
      state.near?.classList.remove('is-near');
      near?.classList.add('is-near');
      state.near = near;
      player.classList.toggle('can-act', !!near);
      tcAct.disabled = !near;
      tcAct.textContent = near ? 'OPEN' : '···';
    }

    // camera follows player, clamped to the world
    const vw = viewport.clientWidth;
    const goal = Math.max(0, Math.min(WORLD_W - vw, state.x - vw / 2));
    cam += (goal - cam) * Math.min(1, dt * 8);
    world.style.transform = `translate3d(${-cam.toFixed(1)}px,0,0)`;
    player.style.transform = `translate3d(${state.x.toFixed(1)}px,0,0)`;
    minimapDot.style.left = `${((state.x - MIN_X) / (MAX_X - MIN_X)) * 100}%`;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
