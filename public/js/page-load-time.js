(() => {
  const msToSec = (ms) => (ms / 1000).toFixed(3);

  window.addEventListener('load', () => {
    const loadTime = performance.now(); 

    const nav = performance.getEntriesByType('navigation')[0];
    const domTime = nav.domContentLoadedEventEnd - nav.startTime

    const candidate =
      document.querySelector('.site-footer, body > footer, footer[role="contentinfo"]') ||
      (() => {
        const all = document.querySelectorAll('footer');
        return all.length ? all[all.length - 1] : null;
      })();

    const pageFooter = candidate || document.body;

    el = document.createElement('p');
    el.id = 'load-time';
    el.style.margin = '8px 0';
    el.style.fontSize = '0.95rem';
    el.style.opacity = '0.9';
    pageFooter.appendChild(el);

    const serverTimeDiv = document.getElementById('server-time');
    const serverTime = serverTimeDiv ? serverTimeDiv.textContent : '';

    el.innerHTML = `
      Page load time is <strong>${msToSec(loadTime)}</strong> Seconds
      &middot; DOMContentLoaded: <strong>${msToSec(domTime)}</strong> Seconds
      ${serverTime ? `&middot; Server: <strong>${serverTime}</strong>` : ''}
    `;
  });
})();