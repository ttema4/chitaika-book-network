document.addEventListener('DOMContentLoaded', () => {
    const rawContent = document.getElementById('raw-content').value;
    const container = document.getElementById('reader-content');
    const gutter = document.getElementById('reader-gutter');
    const selectionBtn = document.getElementById('selection-btn');
    const popup = document.getElementById('comment-popup');
    const sidebarPanel = document.getElementById('sidebar-panel');
    const sidebarList = document.getElementById('sidebar-list');
    
    console.log('[Reader] User Logged In:', USER_LOGGED_IN);
    console.log('[Reader] Current User:', CURRENT_USER);

    let activeComments = COMMENTS_DATA || [];
    let currentSelectionRange = null;
    let currentSelectionGlobal = null;
    let tempDraftSelection = null;

    function renderText() {
        container.innerHTML = '';
        
        const boundaries = new Set([0, rawContent.length]);
        activeComments.forEach(c => {
            boundaries.add(c.start_offset);
            boundaries.add(c.end_offset);
        });
        
        if (tempDraftSelection) {
            boundaries.add(tempDraftSelection.start);
            boundaries.add(tempDraftSelection.end);
        }
        
        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
        
        for (let i = 0; i < sortedBoundaries.length - 1; i++) {
            const start = sortedBoundaries[i];
            const end = sortedBoundaries[i+1];
            const textSegment = rawContent.substring(start, end);
            
            if (!textSegment) continue;

            const span = document.createElement('span');
            span.textContent = textSegment;
            span.dataset.start = start; 
            
            const coveringComments = activeComments.filter(c => 
                c.start_offset <= start && c.end_offset >= end
            );
            
            const isDraft = tempDraftSelection && 
                            tempDraftSelection.start <= start && 
                            tempDraftSelection.end >= end;

            if (coveringComments.length > 0 || isDraft) {
                span.classList.add('highlight');
                
                if (isDraft) {
                    span.classList.add('highlight-draft');
                }
                
                if (coveringComments.length > 0) {
                    span.dataset.commentIds = coveringComments.map(c => c.id).join(',');
                    span.addEventListener('mouseenter', (e) => {
                         if (tempDraftSelection) return;
                         showCommentTooltip(e, coveringComments);
                         highlightCommentGroup(coveringComments.map(c => c.id));
                    });
                    span.addEventListener('mouseleave', () => {
                         if (tempDraftSelection) return;
                         hidePopupDelay();
                         clearHighlightGroup();
                    });
                }
            }
            
            container.appendChild(span);
        }
    }
    
    function highlightCommentGroup(ids) {
        if (!ids || ids.length === 0) return;
        const allHighlights = document.querySelectorAll('.highlight');
        
        allHighlights.forEach(span => {
            const spanIds = (span.dataset.commentIds || '').split(',').map(Number);
            const hasMatch = spanIds.some(id => ids.includes(id));
            if (hasMatch) {
                span.classList.add('group-hover');
            }
        });
    }
    
    function clearHighlightGroup() {
        document.querySelectorAll('.highlight.group-hover').forEach(span => {
            span.classList.remove('group-hover');
        });
    }

    function renderGutter() {
        gutter.innerHTML = '';
        const spans = Array.from(container.children);
        
        const commentPositions = []; 
        
        activeComments.forEach(c => {
            const targetSpan = spans.find(s => parseInt(s.dataset.start) === c.start_offset);
            
            if (targetSpan) {
                commentPositions.push({
                    comment: c,
                    top: targetSpan.offsetTop,
                    id: c.id
                });
            } else {
                 const fallbackSpan = spans.find(s => {
                    const start = parseInt(s.dataset.start);
                    const end = start + s.textContent.length;
                    return c.start_offset >= start && c.start_offset < end;
                 });
                 if (fallbackSpan) {
                     commentPositions.push({
                        comment: c,
                        top: fallbackSpan.offsetTop,
                        id: c.id
                     });
                 }
            }
        });

        commentPositions.sort((a, b) => a.top - b.top);
        
        const clusters = [];
        const THRESHOLD = 24;
        
        commentPositions.forEach(item => {
            if (clusters.length === 0) {
                clusters.push([item]);
                return;
            }
            
            const lastCluster = clusters[clusters.length - 1];
            const lastItem = lastCluster[lastCluster.length - 1];
            
            if ((item.top - lastItem.top) < THRESHOLD) {
                lastCluster.push(item);
            } else {
                clusters.push([item]);
            }
        });

        clusters.forEach(cluster => {
            if (cluster.length === 0) return;
            
            const mainItem = cluster[0];
            const groupDiv = document.createElement('div');
            groupDiv.className = 'gutter-group';
            groupDiv.style.top = mainItem.top + 'px';
            
            const renderLimit = Math.min(cluster.length, 3);
            
            for (let i = 0; i < renderLimit; i++) {
                const c = cluster[i].comment;
                const avatar = document.createElement('div');
                avatar.className = 'gutter-avatar';
                
                const user = c.user || {};
                const avatarUrl = user.avatar_url 
                    ? user.avatar_url 
                    : 'https://storage.yandexcloud.net/book-network/images/avatar.png';
                
                avatar.style.backgroundImage = `url(${avatarUrl})`;
                
                groupDiv.appendChild(avatar);
            }
            
            const allComments = cluster.map(item => item.comment);
            
            groupDiv.addEventListener('mouseenter', (e) => {
                if (tempDraftSelection) return;
                showCommentTooltip(e, allComments);
            });
            groupDiv.addEventListener('mouseleave', () => {
                if (tempDraftSelection) return;
                hidePopupDelay();
            });
            
            groupDiv.onclick = (e) => {
                e.stopPropagation();
            };
            
            gutter.appendChild(groupDiv);
        });
    }

    const scrollContainer = document.querySelector('.reader-body') || window;
    scrollContainer.addEventListener('scroll', () => {
        if (popup.classList.contains('visible') || popup.style.display === 'block') {
            closePopup(); 
            selectionBtn.classList.remove('visible');
        }
    }, { passive: true });
    
    document.addEventListener('mousedown', (e) => {
        if (!popup.classList.contains('visible')) return;
        if (popup.contains(e.target)) return;
        if (e.target.closest('#selection-btn')) return;
        
        closePopup();
    });

    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        
        if (selection.isCollapsed || !container.contains(selection.anchorNode)) {
            selectionBtn.classList.remove('visible');
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const scrollY = window.scrollY;
        
        selectionBtn.style.top = (rect.top + scrollY) + 'px';
        selectionBtn.style.left = (rect.left + rect.width / 2) + 'px';
        selectionBtn.classList.add('visible');

        currentSelectionRange = range;
        currentSelectionGlobal = calculateGlobalRange(range);
    });

    function calculateGlobalRange(range) {
        const getGlobalOffset = (node, offset) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const span = node.parentNode;
                const spanStart = parseInt(span.dataset.start || 0);
                return spanStart + offset;
            }
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
               return parseInt(node.dataset.start || 0);
            }
            return 0;
        };

        const start = getGlobalOffset(range.startContainer, range.startOffset);
        const end = getGlobalOffset(range.endContainer, range.endOffset);
        
        return { 
            start: Math.min(start, end), 
            end: Math.max(start, end) 
        };
    }

    let hideTimeout;

    function showPopup(x, y, content, interactive=false) {
        console.log('[Reader] showPopup called', {x, y, interactive});
        clearTimeout(hideTimeout);
        popup.innerHTML = content;
        
        popup.style.display = 'block';
        popup.style.visibility = 'hidden';
        popup.classList.add('visible');
        
        const viewportWidth = window.innerWidth;
        if (x + 340 > viewportWidth) {
            x = viewportWidth - 350;
        }
        if (x < 10) x = 10;
        
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        popup.style.visibility = 'visible';
        
        if (interactive) {
            popup.style.pointerEvents = 'auto';
            popup.onmouseenter = null;
            popup.onmouseleave = null; 
        } else {
            popup.style.pointerEvents = 'none';
            popup.onmouseenter = () => clearTimeout(hideTimeout);
            popup.onmouseleave = hidePopupDelay;
            popup.style.pointerEvents = 'auto';
        }
        
        console.log('[Reader] Popup styles applied', popup.style.cssText);
    }

    function hidePopupDelay() {
        hideTimeout = setTimeout(() => {
            closePopup();
        }, 300);
    }
    
    selectionBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
    });

    selectionBtn.addEventListener('click', (e) => {
        console.log('[Reader] Selection button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        if (!USER_LOGGED_IN) {
            console.warn('[Reader] User not logged in');
            alert('Сначала войдите в систему.');
            return;
        }

        let rect;
        if (currentSelectionRange) {
             rect = currentSelectionRange.getBoundingClientRect();
        } else {
             rect = selectionBtn.getBoundingClientRect();
        }

        const scrollY = window.scrollY;
        
        const formHtml = `
            <div class="comment-form-inline">
                <input type="text" id="comment-input" class="comment-input-inline" placeholder="Ваш комментарий..." autocomplete="off">
                <button class="btn-icon-send" onclick="submitComment()" title="Отправить">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
        `;
        
        showPopup(0, 0, formHtml, true);
        
        tempDraftSelection = currentSelectionGlobal;
        renderText();

        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        
        popup.classList.add('arrow-down', 'centered-arrow', 'creation-mode'); 
        popup.classList.remove('side-positioned');

        const popupH = popup.offsetHeight;
        const popupW = popup.offsetWidth;
        
        const selectionCenter = rect.left + (rect.width / 2);
        const targetTop = rect.top + scrollY - popupH - 12;
        let targetLeft = selectionCenter - (popupW / 2);
        
        const viewportWidth = window.innerWidth;
        if (targetLeft < 10) targetLeft = 10;
        if (targetLeft + popupW > viewportWidth - 10) targetLeft = viewportWidth - popupW - 10;
        
        popup.style.top = targetTop + 'px';
        popup.style.left = targetLeft + 'px';
        popup.style.zIndex = '99999';
        
        setTimeout(() => {
             const input = document.getElementById('comment-input');
             if(input) {
                 input.focus();
                 input.onkeydown = (e) => {
                     if (e.key === 'Enter') submitComment();
                 };
                 console.log('[Reader] Input focused');
             } else {
                 console.error('[Reader] Input not found');
             }
        }, 100);
    });

    window.closePopup = () => {
        popup.classList.remove('visible');
        popup.style.display = 'none';
        
        popup.classList.remove('creation-mode', 'arrow-down', 'centered-arrow', 'side-positioned');
        
        if (tempDraftSelection) {
            tempDraftSelection = null;
            renderText();
        }
    };

    window.submitComment = async () => {
        const content = document.getElementById('comment-input').value;
        if (!content) return;

        try {
            const res = await fetch('/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    book_id: BOOK_ID,
                    content: content,
                    start_offset: currentSelectionGlobal.start,
                    end_offset: currentSelectionGlobal.end
                })
            });

            if (res.ok) {
                const newComment = await res.json();
                newComment.user = CURRENT_USER; 
                
                activeComments.push(newComment);
                renderText();
                renderGutter();
                renderSidebarList();
                closePopup();
                selectionBtn.classList.remove('visible');
                window.getSelection().removeAllRanges();
            } else {
                alert('Ошибка при сохранении');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка сети');
        }
    };
    
    window.deleteComment = async (id, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        if (!confirm('Удалить комментарий?')) return;
        
        try {
            const res = await fetch(`/comments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                activeComments = activeComments.filter(c => String(c.id) !== String(id));
                renderText();
                renderGutter();
                renderSidebarList();
                closePopup(); 
            } else {
                alert('Не удалось удалить');
            }
        } catch(e) {
            console.error(e);
            alert('Ошибка сети');
        }
    };

    function showCommentTooltip(e, comments) {
        popup.classList.remove('arrow-down', 'centered-arrow', 'creation-mode');
        
        const target = e.currentTarget; 
        const rect = target.getBoundingClientRect();
        const scrollY = window.scrollY;
        
        const html = comments.map((c, index) => {
            const user = c.user || {};
            const rawDate = c.createdAt || c.created_at || new Date();
            const dateObj = new Date(rawDate);
            const dateStr = !isNaN(dateObj.getTime()) 
                ? dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric'}) + ' в ' + dateObj.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
                : '';
                
            const avatarUrl = user.avatar_url 
                ? user.avatar_url 
                : 'https://storage.yandexcloud.net/book-network/images/avatar.png';
            
            const profileLink = user.id ? `/users/${user.id}` : '#';
            const isLast = index === comments.length - 1;
            
            const canDelete = USER_LOGGED_IN && (String(user.id) === String(CURRENT_USER.id));

            return `
            <div class="comment-view" style="${!isLast ? 'margin-bottom: 12px; padding-bottom: 12px;' : ''}" class="comment-item">
                <div class="comment-view-header">
                    <a href="${profileLink}" class="comment-avatar-sm" style="background-image: url('${avatarUrl}'); background-size: cover; background-color: #f3f4f6; display:block;"></a>
                    <a href="${profileLink}" class="comment-author-name" style="text-decoration:none; color:inherit;">${user.firstName || user.username || 'Гость'}</a>
                    <span class="comment-date">${dateStr}</span>
                    ${canDelete ? `
                        <button class="btn-delete-comment" onclick="deleteComment('${c.id}', event)" title="Удалить">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="comment-content-text">${escapeHtml(c.content)}</div>
            </div>
        `}).join('');
        
        let x = rect.left;
        let y = rect.bottom + scrollY + 5;
        if (target.classList.contains('gutter-avatar')) {
             x = rect.right + 12;
             y = rect.top + scrollY - 10;
             popup.classList.add('side-positioned');
        } else {
             x = rect.left;
             popup.classList.remove('side-positioned');
        }

        showPopup(x, y, html, false);
    }

    window.toggleTheme = () => {
        document.body.classList.toggle('theme-dark');
    };
    window.changeFontSize = (delta) => {
        const style = window.getComputedStyle(container);
        const currentSize = parseFloat(style.fontSize);
        container.style.fontSize = (currentSize + delta) + 'px';
        setTimeout(renderGutter, 50);
    };
    
    window.addEventListener('resize', () => {
        setTimeout(renderGutter, 100);
    });

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    window.toggleSidebar = () => {
        sidebarPanel.classList.toggle('open');
        if (sidebarPanel.classList.contains('open')) {
            renderSidebarList();
        }
    };

    function renderSidebarList() {
        sidebarList.innerHTML = '';
        if (activeComments.length === 0) {
            sidebarList.innerHTML = '<div style="color:#aaa; text-align:center; padding:20px;">Нет комментариев</div>';
            return;
        }

        const sorted = [...activeComments].sort((a,b) => a.start_offset - b.start_offset);

        sorted.forEach(c => {
            const el = document.createElement('div');
            el.className = 'sidebar-comment-item';
            
            const quote = rawContent.substring(c.start_offset, c.end_offset);
            
            const rawDate = c.createdAt || c.created_at || new Date();
            const dateObj = new Date(rawDate);
            const dateStr = !isNaN(dateObj.getTime()) 
                ? dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' + dateObj.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
                : '';

            el.innerHTML = `
                <div style="font-size:11px; color:#9ca3af; margin-bottom:6px; border-left:2px solid #e5e7eb; padding-left:8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-style: italic;">
                   "${escapeHtml(quote)}"
                </div>
                <div style="font-size:13px; color: #374151; line-height: 1.4; margin-bottom: 6px;">${escapeHtml(c.content)}</div>
                <div style="font-size:11px; color:#9ca3af; display:flex; justify-content:space-between; align-items: center;">
                   <span style="font-weight: 500;">${c.user?.firstName || c.user?.username || 'Guest'}</span>
                   <span>${dateStr}</span>
                </div>
            `;
            
            el.onclick = () => {
                const span = Array.from(container.children).find(s => parseInt(s.dataset.start) === c.start_offset);
                if(span) {
                    span.scrollIntoView({behavior:'smooth', block:'center'});
                    span.style.transition = 'background 0.5s';
                    const oldBg = span.style.backgroundColor;
                    span.style.backgroundColor = 'rgba(255, 165, 0, 0.5)';
                    setTimeout(() => span.style.backgroundColor = oldBg, 1500);
                    if(window.innerWidth < 800) toggleSidebar();
                }
            };
            
            sidebarList.appendChild(el);
        });
    }

    setTimeout(() => {
        renderText();
        setTimeout(renderGutter, 100);
    }, 100);
});