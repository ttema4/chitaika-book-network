(() => {
  const current = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  document.querySelectorAll('.nav__link').forEach(link => {
    const path = new URL(link.href).pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
    link.classList.toggle('nav__link--active', path === current);
    if (path === current) link.setAttribute('aria-current', 'page');
  });
})();