document.addEventListener('DOMContentLoaded', () => {
  const swiper = new Swiper('.picks-swiper', {
    slidesPerView: 1.15,
    centeredSlides: true,
    spaceBetween: 14,
    loop: true,
    autoHeight: true,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    pagination: { el: '.swiper-pagination', clickable: true },
    a11y: { enabled: true },
    breakpoints: {
      480:  { slidesPerView: 1.4, spaceBetween: 16 },
      768:  { slidesPerView: 2.2, spaceBetween: 18 },
      1024: { slidesPerView: 3,   spaceBetween: 20, autoHeight: false }
    }
  });

  function showAddedToast(bookTitle){
    Toastify({
      text: `«${bookTitle}» добавлена в избранное`,
      duration: 2500,
      gravity: 'top',
      position: 'right',
      close: true,
      stopOnFocus: true,
      offset: { x: 16, y: 16 },
      ariaLive: 'polite'
    }).showToast();
  }

  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const title = e.currentTarget.getAttribute('data-book') || 'Книга';
      showAddedToast(title);
    });
  });

  if (!window.Swiper || !swiper) {
    document.querySelectorAll('.swiper-wrapper').forEach(w => {
      w.style.display = 'grid';
      w.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
      w.style.gap = '16px';
    });
  }
});