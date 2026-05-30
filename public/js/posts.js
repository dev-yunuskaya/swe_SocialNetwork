const CATEGORY_LABELS = {
  technology: 'Technology',
  sports: 'Sports',
  music: 'Music',
  art: 'Art',
  science: 'Science',
  travel: 'Travel',
  food: 'Food',
  gaming: 'Gaming',
};

function profileUrl(username) {
  return `/profile.html?user=${encodeURIComponent(username)}`;
}

function isValidDisplayTag(tag) {
  const t = String(tag).toLowerCase();
  return t.length >= 2 && !/^\d+$/.test(t);
}

function primaryCategory(post) {
  const raw = post.hashtags?.length
    ? post.hashtags.map((t) => String(t).toLowerCase())
    : (post.content.match(/#[\w\u00C0-\u024F]+/gi) || []).map((t) => t.slice(1).toLowerCase());
  const tags = raw.filter(isValidDisplayTag);
  const known = tags.find((t) => CATEGORY_LABELS[t]);
  if (known) return CATEGORY_LABELS[known];
  const tag = tags[0];
  return tag ? CATEGORY_LABELS[tag] || tag : null;
}

function renderPostActions(post, options = {}) {
  const showFollow =
    options.showFollow &&
    !post.is_own_post &&
    !post.is_following_author &&
    post.author?.id;

  return `
    <div class="post-actions" data-post-id="${post.id}">
      <button type="button" class="action-btn like-btn ${post.liked_by_me ? 'active' : ''}" data-action="like" aria-label="Like">
        ${post.liked_by_me ? '♥' : '♡'} <span class="like-count">${post.like_count ?? 0}</span>
      </button>
      <button type="button" class="action-btn" data-action="comment-toggle" aria-label="Comment">
        💬 <span class="comment-count">${post.comment_count ?? 0}</span>
      </button>
      <a class="action-btn action-link" href="/post.html?id=${post.id}">Details</a>
      ${
        showFollow
          ? `<button type="button" class="action-btn follow-btn" data-action="follow" data-user-id="${post.author.id}">+ Follow</button>`
          : ''
      }
    </div>
    <div class="comment-box hidden" data-comment-box="${post.id}">
      <textarea rows="2" maxlength="300" placeholder="Write a comment..."></textarea>
      <button type="button" class="btn btn-primary btn-sm" data-action="comment-submit">Post</button>
    </div>
  `;
}

function renderInteractivePostCard(post, options = {}) {
  const img = post.image_path
    ? `<img src="${imageUrl(post.image_path)}" alt="Post image" />`
    : '';
  const category = primaryCategory(post);
  const categoryBadge = category
    ? `<span class="category-badge">${escapeHtml(category)}</span>`
    : '';

  return `
    <article class="post-card interactive-post" data-post-id="${post.id}">
      <div class="post-header">
        <a class="author-link" href="${profileUrl(post.author?.username || '')}">
          <span class="avatar">${(post.author?.username || '?')[0].toUpperCase()}</span>
          <span>
            <strong>@${escapeHtml(post.author?.username || 'unknown')}</strong>
            <span class="post-meta">${formatDate(post.created_at)}</span>
          </span>
        </a>
        ${categoryBadge}
      </div>
      <p class="post-content">${escapeHtml(post.content)}</p>
      ${img}
      ${renderPostActions(post, options)}
    </article>
  `;
}

function mountInteractivePosts(container, posts, options = {}) {
  if (!posts.length) {
    container.innerHTML = options.emptyText
      ? `<p class="post-meta">${options.emptyText}</p>`
      : '';
    return;
  }

  container.innerHTML = posts.map((p) => renderInteractivePostCard(p, options)).join('');

  container.querySelectorAll('.interactive-post').forEach((card) => {
    const postId = Number(card.dataset.postId);

    card.querySelector('[data-action="like"]')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const countEl = btn.querySelector('.like-count');
      const liked = btn.classList.contains('active');
      try {
        if (liked) {
          await api(`/api/posts/${postId}/like`, { method: 'DELETE' });
          btn.classList.remove('active');
          btn.innerHTML = `♡ <span class="like-count">${Math.max(0, Number(countEl.textContent) - 1)}</span>`;
        } else {
          await api(`/api/posts/${postId}/like`, { method: 'POST' });
          btn.classList.add('active');
          btn.innerHTML = `♥ <span class="like-count">${Number(countEl.textContent) + 1}</span>`;
        }
        if (options.onLike) await options.onLike();
      } catch (err) {
        if (!err.message.includes('Already')) alert(err.message);
      }
    });

    card.querySelector('[data-action="comment-toggle"]')?.addEventListener('click', () => {
      card.querySelector(`[data-comment-box="${postId}"]`)?.classList.toggle('hidden');
    });

    card.querySelector('[data-action="comment-submit"]')?.addEventListener('click', async () => {
      const box = card.querySelector(`[data-comment-box="${postId}"]`);
      const textarea = box.querySelector('textarea');
      const text = textarea.value.trim();
      if (!text) return;
      try {
        await api(`/api/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content: text }),
        });
        textarea.value = '';
        box.classList.add('hidden');
        const countEl = card.querySelector('.comment-count');
        countEl.textContent = Number(countEl.textContent) + 1;
        if (options.onComment) await options.onComment();
      } catch (err) {
        alert(err.message);
      }
    });

    card.querySelector('[data-action="follow"]')?.addEventListener('click', async (e) => {
      const userId = e.currentTarget.dataset.userId;
      try {
        await api(`/api/users/${userId}/follow`, { method: 'POST' });
        e.currentTarget.textContent = 'Following';
        e.currentTarget.disabled = true;
        if (options.onFollow) await options.onFollow();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
