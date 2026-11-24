// Two-city clock (Busan ↔ Philly) and active section chip for the flat page.
const clock = document.getElementById('clock');
const fmt = (tz) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());
const tick = () => { clock.textContent = `부산 ${fmt('Asia/Seoul')} · 필라델피아 ${fmt('America/New_York')}`; };
tick();
setInterval(tick, 15000);

const links = [...document.querySelectorAll('.bar-views a')];
const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const id = e.target.id === 'projects' ? 'systems' : e.target.id;
    links.forEach((a) => a.classList.toggle('is-active', a === map.get(id)));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));
