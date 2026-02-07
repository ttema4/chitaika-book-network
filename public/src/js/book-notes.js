(() => {
  const root = document.getElementById('book-notes');
  if (!root) return;

  const bookId =
    root.dataset.bookId ||
    new URLSearchParams(location.search).get('id') ||
    (document.title?.trim().toLowerCase().replace(/\s+/g, '-') || 'book');

  const STORAGE_KEY = `book:${bookId}:notes`;

  const form = root.querySelector('#bn-form');
  const list = root.querySelector('#bn-list');
  const tpl  = root.querySelector('#bn-tpl');

  const readStore = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const writeStore = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const uid = () => (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  const nowISO = () => new Date().toISOString();
  const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(n);


  function renderAll() {
    list.innerHTML = '';
    for (const note of readStore()) list.appendChild(renderItem(note));
  }

  function renderItem(model) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = model.id;
    node.querySelector('.bn-card__author').textContent = model.name;
    node.querySelector('.bn-card__text').textContent = model.text;
    node.querySelector('.bn-card__rating').textContent = stars(Number(model.rating));
    const timeEl = node.querySelector('.bn-card__time');
    timeEl.dateTime = model.createdAt;
    timeEl.textContent = new Date(model.createdAt).toLocaleString();
    return node;
  }

  function validateJS(data) {
    const errors = {};
    if (!/^[- А-Яа-яA-Za-zЁё]{2,40}$/.test(data.name.trim()))
      errors.name = 'Имя: 2–40 символов, только буквы, пробел и дефис';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email))
      errors.email = 'Некорректный e-mail';
    if (!data.rating) errors.rating = 'Укажите оценку';
    if (data.text.trim().length < 10) errors.text = 'Заметка слишком короткая (мин. 10 символов)';
    return errors;
  }

  function showErrors(errors) {
    const ids = { name: 'bn-name-error', email: 'bn-email-error', rating: 'bn-rating-error', text: 'bn-text-error' };
    for (const k in ids) {
      const el = document.getElementById(ids[k]);
      if (!el) continue;
      if (errors[k]) { el.textContent = errors[k]; el.hidden = false; }
      else { el.textContent = ''; el.hidden = true; }
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const data = Object.fromEntries(new FormData(form).entries());
    const model = {
      id: uid(),
      name: String(data.name).trim(),
      email: String(data.email || '').trim(),
      rating: String(data.rating),
      text: String(data.text).trim(),
      createdAt: nowISO()
    };

    const errors = validateJS(model);
    showErrors(errors);
    if (Object.keys(errors).length) return;

    const store = readStore();
    store.unshift(model);
    writeStore(store);

    list.prepend(renderItem(model));
    form.reset();
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const card = btn.closest('.card'); const id = card?.dataset.id; if (!id) return;

    if (btn.classList.contains('js-delete')) {
      writeStore(readStore().filter(n => n.id !== id));
      card.remove();
      return;
    }
    if (btn.classList.contains('js-edit'))  { startEdit(card); return; }
    if (btn.classList.contains('js-save'))  { saveEdit(card);  return; }
    if (btn.classList.contains('js-cancel')){ cancelEdit(card);return; }
  });

  function startEdit(card) {
    if (card.classList.contains('bn-card--editing')) return;
    card.classList.add('bn-card--editing');
    const p = card.querySelector('.bn-card__text');
    const ta = document.createElement('textarea');
    ta.value = p.textContent;
    p.replaceWith(ta);
    card.dataset.orig = ta.value;
    toggleButtons(card, true);
    ta.focus();
  }

  function saveEdit(card) {
    const ta = card.querySelector('textarea');
    const val = ta.value.trim();
    if (val.length < 10) { showErrors({ text: 'Заметка слишком короткая (мин. 10 символов)' }); ta.focus(); return; }

    const store = readStore();
    const idx = store.findIndex(n => n.id === card.dataset.id);
    if (idx !== -1) { store[idx].text = val; writeStore(store); }

    const p = document.createElement('p');
    p.className = 'bn-card__text';
    p.textContent = val;
    ta.replaceWith(p);
    card.classList.remove('bn-card--editing');
    toggleButtons(card, false);
  }

  function cancelEdit(card) {
    const ta = card.querySelector('textarea');
    const p = document.createElement('p');
    p.className = 'bn-card__text';
    p.textContent = card.dataset.orig || '';
    ta.replaceWith(p);
    card.classList.remove('bn-card--editing');
    toggleButtons(card, false);
  }

  function toggleButtons(card, editing) {
    card.querySelector('.js-edit').classList.toggle('bn-hidden', editing);
    card.querySelector('.js-delete').classList.toggle('bn-hidden', editing);
    card.querySelector('.js-save').classList.toggle('bn-hidden', !editing);
    card.querySelector('.js-cancel').classList.toggle('bn-hidden', !editing);
  }

  renderAll();
})();