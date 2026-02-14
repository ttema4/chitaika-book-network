document.addEventListener('DOMContentLoaded', () => {
    function showToast(message, type = 'success') {
      if (typeof Toastify === 'function') {
          Toastify({
          text: message,
          duration: 3000,
          gravity: 'top',
          position: 'right',
          close: true,
          style: {
              background: type === 'error' ? "var(--error)" : "var(--primary)",
          },
          ariaLive: 'polite'
          }).showToast();
      }
    }

    document.body.addEventListener('click', async (e) => {
      const btn = e.target.closest('.fav-btn');
      if (!btn) return;
  
      if (btn.disabled) {
          showToast('Войдите, чтобы добавить в избранное', 'error');
          return;
      }

      const title = btn.getAttribute('data-book') || 'Книга';
      const bookId = btn.getAttribute('data-book-id');

      const wasActive = btn.classList.contains('is-active');
      btn.classList.toggle('is-active');
      btn.setAttribute('aria-pressed', !wasActive);
      e.preventDefault(); 
  
      try {
          const method = wasActive ? 'DELETE' : 'POST';
          const response = await fetch('/favorites', {
              method,
              headers: { 
                  'Content-Type': 'application/json', 
                  'Accept': 'application/json' 
              },
              body: JSON.stringify({ bookId: parseInt(bookId) })
          });

          if (!response.ok) {
               throw new Error('Request failed');
          }

          if (!wasActive) {
              showToast(`«${title}» добавлена в избранное`);
          } else {
              showToast(`«${title}» удалена из избранного`);
          }
      } catch (err) {
          console.error(err);
          btn.classList.toggle('is-active');
          showToast('Ошибка сохранения. Попробуйте позже.', 'error');
      }
    });

    document.body.addEventListener('click', async (e) => {
        const btn = e.target.closest('.friend-btn');
        if (!btn) return;
        
        if (btn.disabled || btn.classList.contains('disabled')) {
             return;
        }

        e.preventDefault();
        const userId = btn.getAttribute('data-user-id');
        const username = btn.getAttribute('data-username');
        const action = btn.dataset.action;
        const url = `/users/friends/${userId}${action === 'remove' ? '/remove' : ''}`;

        btn.disabled = true;

        try {
             const response = await fetch(url, {
                 method: 'POST',
                 headers: {
                     'Accept': 'application/json'
                 }
             });

             if (response.ok) {
                 if (action === 'add') {
                     showToast(`Вы подписались на ${username}`);
                     if (window.location.pathname === '/users/readers') {
                         setTimeout(() => window.location.reload(), 500);
                         return;
                     }

                     btn.dataset.action = 'remove';
                     btn.textContent = 'Отписаться';
                     btn.classList.remove('btn--primary');
                     btn.classList.add('btn--danger');
                     
                     const card = btn.closest('.card');
                     const avatarBox = card.querySelector('.user-card__avatar-box');
                     if (avatarBox) {
                        const existing = avatarBox.querySelector('.user-card__badge');
                        if (!existing) {
                             const badge = document.createElement('span');
                             badge.className = 'user-card__badge';
                             badge.textContent = 'Подписка';
                             avatarBox.appendChild(badge);
                        }
                     }
                 } else {
                     showToast(`Вы отписались от ${username}`);
                     if (window.location.pathname === '/users/readers') {
                         setTimeout(() => window.location.reload(), 500);
                         return;
                     }

                     btn.dataset.action = 'add';
                     btn.textContent = 'Подписаться';
                     btn.classList.remove('btn--danger');
                     btn.classList.add('btn--primary');
                     
                     const card = btn.closest('.card');
                     const badge = card.querySelector('.user-card__badge');
                     if (badge) badge.remove();
                 }
             } else {
                 showToast('Ошибка выполнения запроса', 'error');
             }
        } catch (err) {
            console.error(err);
            showToast('Ошибка сети', 'error');
        } finally {
            btn.disabled = false;
        }
  });
});
