function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function imageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const normalized = imagePath.replace(/^\/+/, '');
  if (normalized.startsWith('uploads/')) {
    return `/${normalized}`;
  }
  return `/uploads/${normalized}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US');
}

function renderNav(active) {
  const links = [
    { href: '/feed.html', label: 'Feed', key: 'feed' },
    { href: '/profile.html', label: 'Profile', key: 'profile' },
    { href: '/messages.html', label: 'Messages', key: 'messages' },
    { href: '/notifications.html', label: 'Notifications', key: 'notifications' },
  ];

  return `
    <nav class="nav">
      <a class="brand" href="/feed.html">Social Network</a>
      ${links
        .map(
          (l) =>
            `<a href="${l.href}"${active === l.key ? ' style="font-weight:700"' : ''}>${l.label}</a>`
        )
        .join('')}
      <button type="button" onclick="logout()">Log out</button>
    </nav>
  `;
}

function mountNav(active) {
  const placeholder = document.getElementById('nav-placeholder');
  if (placeholder) {
    placeholder.outerHTML = renderNav(active);
  }
}

function renderPostCard(post, options = {}) {
  const img = post.image_path
    ? `<img src="${imageUrl(post.image_path)}" alt="Post image" />`
    : '';
  const detailLink = options.showLink !== false
    ? `<a href="/post.html?id=${post.id}">Details / Comments</a>`
    : '';

  return `
    <article class="post-card">
      <div class="post-meta">@${escapeHtml(post.author?.username || 'unknown')} · ${formatDate(post.created_at)}</div>
      <p>${escapeHtml(post.content)}</p>
      ${img}
      <p class="post-meta">${post.like_count ?? 0} likes · ${post.comment_count ?? 0} comments</p>
      ${detailLink}
    </article>
  `;
}
