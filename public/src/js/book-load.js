document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('book-wrapper');
  const section = document.getElementById('book');
  const loader = document.getElementById('book-loader');
  const error = document.getElementById('book-error');
  const card = section.querySelector('.card');

  const titleEl = section.querySelector('.section__title');
  const metaEl = card.querySelector('.card__meta');
  const imgEl = card.querySelector('.figure__img');
  const captionEl = card.querySelector('.figure__caption');
  const textEl = card.querySelector('.card__text');

  const useHighId = localStorage.getItem('useHighId') !== 'false';
  localStorage.setItem('useHighId', (!useHighId).toString());

  const bookId = useHighId ? Math.floor(Math.random() * 10) + 51 : Math.floor(Math.random() * 10) + 1;

  const postUrl = `https://jsonplaceholder.typicode.com/posts/${bookId}`;   
  const userUrl = `https://jsonplaceholder.typicode.com/users/${bookId % 10 + 1}`;

  Promise.all([
    fetch(postUrl).then(r => r.ok ? r.json() : Promise.reject('Ошибка поста')),
    fetch(userUrl).then(r => r.ok ? r.json() : Promise.reject('Ошибка пользователя'))
  ])
    .then(([post, user]) => {
      loader.style.display = 'none'; 
      section.hidden = false;

      titleEl.textContent = post.title;
      metaEl.textContent = `Автор: ${user.name} • Фэнтези, ${2020 + bookId}`;
      imgEl.src = `https://picsum.photos/seed/${bookId}/300/400`;
      imgEl.alt = `Обложка книги «${post.title}»`;
      captionEl.textContent = `Обновлено: ${new Date().toLocaleDateString()}`;
      textEl.textContent = post.body.slice(0, 120) + '...';
    })
    .catch(err => {
      loader.remove();
      error.hidden = false;
      console.error('Ошибка загрузки книги:', err);
    });
});