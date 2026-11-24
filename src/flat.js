// Highlights the current section in the top menu.
const links = [...document.querySelectorAll('.bar-views a')];
const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
const alias = { projects: 'systems' };
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const id = alias[e.target.id] || e.target.id;
    links.forEach((a) => a.classList.toggle('is-active', a === map.get(id)));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));
