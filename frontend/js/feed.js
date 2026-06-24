/* =========================================================
   ConnectHub — feed.js
   Drives feed.html: stories bar, the main post feed (with
   infinite scroll), likes, comments and post deletion.
   ========================================================= */

let feedPage = 1;
let feedLoading = false;
let feedHasMore = true;
const currentUser = Storage.getUser();

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNavbar();
  loadStories();
  loadFeedPage();
  wireInfiniteScroll();
});

/* ---------------------------------------------------------
   Stories bar — built from the people the current user follows.
   ConnectHub's data model (see README) doesn't include a Story
   collection, so this reuses profile pictures as a premium,
   purely-visual nav shortcut into people's profiles.
   --------------------------------------------------------- */
async function loadStories() {
  const bar = document.getElementById('storiesBar');
  if (!bar) return;

  const yourStory = `
    <a class="story-item add-story" href="create-post.html">
      <div class="avatar-ring-wrap">
        ${avatarHTML({ imagePath: currentUser.profileImage, name: currentUser.username, size: 60, ring: true })}
        <span class="avatar-plus">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
        </span>
      </div>
      <span>Your Story</span>
    </a>`;

  try {
    const data = await apiRequest(`/users/${currentUser._id}/following`);
    const followingHtml = data.following
      .slice(0, 14)
      .map(
        (u) => `
        <a class="story-item" href="profile.html?id=${u._id}">
          ${avatarHTML({ imagePath: u.profileImage, name: u.username, size: 60, ring: true })}
          <span>${escapeHtml(u.username)}</span>
        </a>`
      )
      .join('');
    bar.innerHTML = yourStory + followingHtml;
  } catch {
    bar.innerHTML = yourStory;
  }
}

/* ---------------------------------------------------------
   Feed
   --------------------------------------------------------- */
function wireInfiniteScroll() {
  const sentinel = document.getElementById('feedSentinel');
  if (!sentinel) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && feedHasMore && !feedLoading) {
        loadFeedPage();
      }
    },
    { rootMargin: '200px' }
  );
  observer.observe(sentinel);
}

async function loadFeedPage() {
  feedLoading = true;
  const list = document.getElementById('feedList');
  const skeleton = document.getElementById('feedSkeleton');
  if (feedPage === 1 && skeleton) skeleton.style.display = 'block';

  try {
    const data = await apiRequest(`/posts/feed?page=${feedPage}&limit=6`);
    if (skeleton) skeleton.style.display = 'none';

    if (feedPage === 1 && data.posts.length === 0) {
      document.getElementById('feedEmpty').style.display = 'block';
    }

    data.posts.forEach((post) => list.insertAdjacentHTML('beforeend', renderPostCard(post)));
    wireNewlyRenderedCards(list);

    feedHasMore = data.hasMore;
    feedPage += 1;
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    feedLoading = false;
  }
}

function renderPostCard(post) {
  const author = post.userId;
  const isOwn = author._id === currentUser._id;

  return `
  <article class="post-card" data-post-id="${post._id}" data-liked="${post.isLiked}" data-likes="${post.likesCount}">
    <div class="post-header">
      <a href="profile.html?id=${author._id}">${avatarHTML({ imagePath: author.profileImage, name: author.username, size: 34, ring: true })}</a>
      <div class="post-header-meta">
        <a class="username" href="profile.html?id=${author._id}">${escapeHtml(author.username)}</a>
        <div class="time-ago">${timeAgo(post.createdAt)}</div>
      </div>
      ${
        isOwn
          ? `<div class="post-menu-wrap">
              <button class="btn-icon post-menu-btn"><svg viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg></button>
              <div class="post-menu-dropdown">
                <button class="delete-post-btn">Delete post</button>
              </div>
            </div>`
          : ''
      }
    </div>

    <div class="post-media">
      <img src="${resolveImage(post.image)}" alt="Post by ${escapeHtml(author.username)}" loading="lazy" />
      <svg class="double-tap-heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.2 4.5 5.7 4c2-.3 3.9.7 6.3 3 2.4-2.3 4.3-3.3 6.3-3 3.5.5 5.3 4.1 3.7 7.7C19.5 16.4 12 21 12 21z"/></svg>
    </div>

    <div class="post-actions">
      <button class="btn-icon like-btn ${post.isLiked ? 'liked' : ''}">
        <svg viewBox="0 0 24 24" fill="${post.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.2 4.5 5.7 4c2-.3 3.9.7 6.3 3 2.4-2.3 4.3-3.3 6.3-3 3.5.5 5.3 4.1 3.7 7.7C19.5 16.4 12 21 12 21z"/></svg>
      </button>
      <button class="btn-icon comment-focus-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>
    </div>

    <div class="post-body">
      <div class="post-likes-count">${post.likesCount} ${post.likesCount === 1 ? 'like' : 'likes'}</div>
      ${post.caption ? `<div class="post-caption"><a class="username" href="profile.html?id=${author._id}">${escapeHtml(author.username)}</a>${escapeHtml(post.caption)}</div>` : ''}
      <a class="post-view-comments" data-count="${post.commentsCount}">${post.commentsCount > 0 ? `View all ${post.commentsCount} comments` : ''}</a>
      <div class="post-comments-list" style="display:none;"></div>
      <div class="post-add-comment">
        <input type="text" placeholder="Add a comment..." class="comment-input" maxlength="500" />
        <button class="submit-comment-btn">Post</button>
      </div>
    </div>
  </article>`;
}

function wireNewlyRenderedCards(scope) {
  scope.querySelectorAll('.post-card').forEach((card) => {
    if (card.dataset.wired) return;
    card.dataset.wired = 'true';

    const postId = card.dataset.postId;

    // Like button
    card.querySelector('.like-btn').addEventListener('click', () => toggleLike(card, postId));

    // Double-tap-to-like on the image
    let lastTap = 0;
    card.querySelector('.post-media').addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 350) {
        triggerDoubleTapHeart(card);
        if (card.dataset.liked !== 'true') toggleLike(card, postId);
      }
      lastTap = now;
    });

    // Comment focus shortcut
    card.querySelector('.comment-focus-btn').addEventListener('click', () => {
      card.querySelector('.comment-input').focus();
    });

    // View comments
    card.querySelector('.post-view-comments').addEventListener('click', (e) => loadComments(card, postId, e.target));

    // Submit comment
    const input = card.querySelector('.comment-input');
    const submitBtn = card.querySelector('.submit-comment-btn');
    input.addEventListener('input', () => submitBtn.classList.toggle('active', input.value.trim().length > 0));
    const submit = () => submitComment(card, postId, input);
    submitBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });

    // Post menu (own posts only)
    const menuBtn = card.querySelector('.post-menu-btn');
    if (menuBtn) {
      const dropdown = card.querySelector('.post-menu-dropdown');
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) dropdown.classList.remove('open');
      });
      card.querySelector('.delete-post-btn').addEventListener('click', () => deletePost(card, postId));
    }
  });
}

async function toggleLike(card, postId) {
  const btn = card.querySelector('.like-btn');
  const countEl = card.querySelector('.post-likes-count');
  btn.classList.add('like-burst');
  setTimeout(() => btn.classList.remove('like-burst'), 380);

  try {
    const data = await apiRequest(`/posts/like/${postId}`, { method: 'POST' });
    card.dataset.liked = data.liked;
    btn.classList.toggle('liked', data.liked);
    btn.querySelector('svg').setAttribute('fill', data.liked ? 'currentColor' : 'none');
    countEl.textContent = `${data.likesCount} ${data.likesCount === 1 ? 'like' : 'likes'}`;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function triggerDoubleTapHeart(card) {
  const heart = card.querySelector('.double-tap-heart');
  heart.classList.remove('pop');
  void heart.offsetWidth; // restart animation
  heart.classList.add('pop');
}

async function loadComments(card, postId, linkEl) {
  const list = card.querySelector('.post-comments-list');
  const isOpen = list.style.display !== 'none';

  if (isOpen) {
    list.style.display = 'none';
    return;
  }

  list.innerHTML = `<span class="spinner spinner-sm"></span>`;
  list.style.display = 'flex';

  try {
    const data = await apiRequest(`/comments/${postId}`);
    if (!data.comments.length) {
      list.innerHTML = `<span class="text-muted" style="font-size:13px;">No comments yet</span>`;
      return;
    }
    list.innerHTML = data.comments
      .map(
        (c) => `<div class="post-comment-row"><a class="username" href="profile.html?id=${c.userId._id}">${escapeHtml(c.userId.username)}</a>${escapeHtml(c.comment)}</div>`
      )
      .join('');
  } catch (err) {
    list.innerHTML = `<span class="text-muted" style="font-size:13px;">Couldn't load comments</span>`;
  }
}

async function submitComment(card, postId, input) {
  const text = input.value.trim();
  if (!text) return;

  try {
    const data = await apiRequest(`/comments/${postId}`, { method: 'POST', body: { comment: text } });
    input.value = '';
    card.querySelector('.submit-comment-btn').classList.remove('active');

    const viewLink = card.querySelector('.post-view-comments');
    viewLink.textContent = `View all ${data.commentsCount} comments`;

    const list = card.querySelector('.post-comments-list');
    if (list.style.display !== 'none') {
      list.insertAdjacentHTML(
        'beforeend',
        `<div class="post-comment-row"><a class="username" href="profile.html?id=${data.comment.userId._id}">${escapeHtml(data.comment.userId.username)}</a>${escapeHtml(data.comment.comment)}</div>`
      );
    }
    showToast('Comment posted', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePost(card, postId) {
  if (!confirm('Delete this post? This cannot be undone.')) return;

  try {
    await apiRequest(`/posts/${postId}`, { method: 'DELETE' });
    card.style.transition = 'opacity 200ms, transform 200ms';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.97)';
    setTimeout(() => card.remove(), 200);
    showToast('Post deleted', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
