document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.querySelector('.subscribe-action');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const userId = subscribeBtn.dataset.userId;
            const action = subscribeBtn.dataset.action;
            const subscribersValueEl = document.querySelector('.stat-item.subscribers .stat-value');
            
            const isSubscribe = action === 'subscribe';
            const url = isSubscribe ? `/users/friends/${userId}` : `/users/friends/${userId}/remove`;
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const newAction = isSubscribe ? 'unsubscribe' : 'subscribe';
                    subscribeBtn.dataset.action = newAction;
                    
                    const img = subscribeBtn.querySelector('img');
                    const label = subscribeBtn.querySelector('.stat-label');
                    
                    if (isSubscribe) {
                        img.src = 'https://storage.yandexcloud.net/book-network/images/cross.png';
                        img.alt = 'Unsubscribe';
                        label.textContent = 'Отписаться';
                        if (subscribersValueEl) subscribersValueEl.textContent = parseInt(subscribersValueEl.textContent) + 1;
                        
                        Toastify({
                            text: "Вы подписались",
                            duration: 3000,
                            close: true,
                            gravity: "bottom",
                            position: "right",
                            style: { background: "#16a34a" }
                        }).showToast();

                    } else {
                        img.src = 'https://storage.yandexcloud.net/book-network/images/plus.png';
                        img.alt = 'Subscribe';
                        label.textContent = 'Подписаться';
                        if (subscribersValueEl) subscribersValueEl.textContent = Math.max(0, parseInt(subscribersValueEl.textContent) - 1);
                        
                        Toastify({
                            text: "Вы отписались",
                            duration: 3000,
                            close: true,
                            gravity: "bottom",
                            position: "right",
                            style: { background: "#6b7280" }
                        }).showToast();
                    }
                }
            } catch (err) {
                console.error('Failed to toggle subscription', err);
            }
        });
    }

    const widgets = document.querySelectorAll('.status-widget');
    
    widgets.forEach(widget => {
        const bookId = widget.dataset.bookId;
        const currentStatus = widget.dataset.currentStatus || 'none';
        const options = widget.querySelectorAll('.status-option');

        setActiveOption(widget, currentStatus);
        
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const status = opt.dataset.status;
                updateStatus(widget, status, bookId);
            });
        });
    });

    function setActiveOption(widget, status) {
        widget.dataset.currentStatus = status;
        const options = widget.querySelectorAll('.status-option');
        options.forEach(opt => {
            if (opt.dataset.status === status) {
                opt.classList.add('is-active');
            } else {
                opt.classList.remove('is-active');
            }
        });
    }
    
    async function updateStatus(widget, status, bookId) {
        setActiveOption(widget, status);
        
        try {
            await fetch(`/user-books/${bookId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            const statusText = {
                'none': 'Статус удален',
                'planned': 'В планах',
                'reading': 'Читаю',
                'read': 'Прочитано'
            };

            if (typeof Toastify !== 'undefined') {
                 Toastify({
                    text: statusText[status],
                    duration: 3000,
                    close: true,
                    gravity: "bottom",
                    position: "right",
                    style: { background: "#365cff" }
                }).showToast();
            }

        } catch (e) {
            console.error('Failed to update status', e);
        }
    }

    if (typeof EventSource !== "undefined") {
        const eventSource = new EventSource('/books/events');
        eventSource.onmessage = ({ data }) => {
            console.log('New message', data);
            try {
                const message = JSON.parse(data);
                if (typeof Toastify !== 'undefined') {
                    Toastify({
                        text: `📚 Новая книга: ${message.title} (${message.author})`,
                        duration: 5000,
                        gravity: "top", 
                        position: "right", 
                        style: {
                            background: "#0d6efd",
                        }
                    }).showToast();
                }
            } catch (e) {
                console.error("Failed to parse SSE message", e);
            }
        };
        eventSource.onerror = (e) => {
             eventSource.close();
        };
    }

    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
             const section = header.closest('.section');
             if (section) {
                 section.classList.toggle('is-collapsed');
                 
                 if(section.id) {
                     localStorage.setItem('section-collapsed-' + section.id, section.classList.contains('is-collapsed'));
                 }
             }
        });
        
        const section = header.closest('.section');
        if (section && section.id) {
            const isCollapsed = localStorage.getItem('section-collapsed-' + section.id) === 'true';
            if (isCollapsed) section.classList.add('is-collapsed');
        }
    });
    const checkNotifications = async () => {
        try {
            const res = await fetch('/users/me/notifications');
            if (res.ok) {
                const data = await res.json();
                if (data.notifications && data.notifications.length > 0) {
                    data.notifications.forEach(msg => {
                        Toastify({
                            text: msg,
                            duration: 5000,
                            close: true,
                            gravity: "top", 
                            position: "right", 
                            style: { background: "linear-gradient(to right, #3b82f6, #2563eb)" },
                        }).showToast();
                    });
                    await fetch('/users/me/notifications', { method: 'DELETE' });
                }
            }
        } catch (e) {
        }
    };
    
    checkNotifications();
});
