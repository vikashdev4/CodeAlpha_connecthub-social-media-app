/* =========================================================
   ConnectHub — profile.js
   Drives profile.html: loading a user's profile + posts,
   follow/unfollow, editing your own profile, the followers /
   following list modal, and the post detail modal.
   ========================================================= */

const currentUser = Storage.getUser();
let viewedUserId = null;
let viewedIsOwnProfile = false;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNavbar();

  const params = new URLSearchParams(window.location.search);
  viewedUserId = params.get('id') || currentUser._id;

  loadProfile();
  wireEditProfileModal();
  wireFollowListModal();
  wirePostDetailModal();
});

async function loadProfile() {
  document.getElementById('profileSkeleton').style.display = 'block';
  document.getElementById('profileContent').style.display = 'none';

  try {
    const data = await apiRequest(`/users/${viewedUserId}`);
    viewedIsOwnProfile = data.user.isOwnProfile;
    renderProfileHeader(data.user);
    renderPostGrid(data.posts);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    document.getElementById('profileSkeleton').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';
  }
}

function renderProfileHeader(user) {
  document.getElementById('profileAvatarSlot').innerHTML = avatarHTML({
    imagePath: user.profileImage,
    name: user.username,
    size: 124,
    ring: true,
  });
  document.getElementById('profileUsername').textContent = user.username;
  document.getElementById('profileFullName').textContent = user.fullName || '';
  document.getElementById('profileBioText').textContent = user.bio || '';
  document.getElementById('statFollowers').textContent = user.followersCount;
  document.getElementById('statFollowing').textContent = user.followingCount;

  const actionsSlot = document.getElementById('profileActionsSlot');
  if (viewedIsOwnProfile) {
    actionsSlot.innerHTML = `<button class="btn btn-secondary" id="editProfileBtn">Edit Profile</button>`;
    document.getElementById('editProfileBtn').addEventListener('click', () => openEditProfileModal(user));
  } else {
    actionsSlot.innerHTML = user.isFollowing
      ? `<button class="btn btn-outline" id="followToggleBtn" data-following="true">Following</button>`
      : `<button class="btn btn-primary" id="followToggleBtn" data-following="false">Follow</button>`;
    document.getElementById('followToggleBtn').addEventListener('click', toggleFollow);
  }
}

async function toggleFollow() {
  const btn = document.getElementById('followToggleBtn');
  const isFollowing = btn.dataset.following === 'true';
  const endpoint = isFollowing ? `/users/unfollow/${viewedUserId}` : `/users/follow/${viewedUserId}`;

  try {
    await apiRequest(endpoint, { method: 'POST' });
    const followersEl = document.getElementById('statFollowers');
    followersEl.textContent = parseInt(followersEl.textContent) + (isFollowing ? -1 : 1);

    if (isFollowing) {
      btn.textContent = 'Follow';
      btn.className = 'btn btn-primary';
      btn.dataset.following = 'false';
    } else {
      btn.textContent = 'Following';
      btn.className = 'btn btn-outline';
      btn.dataset.following = 'true';
      showToast(`Following ${document.getElementById('profileUsername').textContent}`, 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ---------------------------------------------------------
   Post grid
   --------------------------------------------------------- */
let currentPosts = [];

function renderPostGrid(posts) {
  currentPosts = posts;
  document.getElementById('statPosts').textContent = posts.length;
  const grid = document.getElementById('postGrid');
  const empty = document.getElementById('postsEmptyState');

  if (!posts.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    empty.querySelector('.empty-action').style.display = viewedIsOwnProfile ? 'inline-flex' : 'none';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = posts
    .map(
      (p) => `
    <div class="post-grid-item" data-post-id="${p._id}">
      <img src="${resolveImage(p.image)}" alt="Post" loading="lazy" />
      <div class="post-grid-overlay">
        <span><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.2 4.5 5.7 4c2-.3 3.9.7 6.3 3 2.4-2.3 4.3-3.3 6.3-3 3.5.5 5.3 4.1 3.7 7.7C19.5 16.4 12 21 12 21z"/></svg>${p.likes.length}</span>
        <span><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>${p.commentsCount}</span>
      </div>
    </div>`
    )
    .join('');

  grid.querySelectorAll('.post-grid-item').forEach((el) => {
    el.addEventListener('click', () => openPostDetailModal(el.dataset.postId));
  });
}

/* ---------------------------------------------------------
   Edit profile modal
   --------------------------------------------------------- */
let editSelectedFile = null;

function wireEditProfileModal() {
  const form = document.getElementById('editProfileForm');
  if (!form) return;

  const fileInput = document.getElementById('editAvatarInput');
  fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) return;
    editSelectedFile = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('editAvatarSlot').innerHTML = `<span class="avatar-ring"><img class="avatar" src="${e.target.result}" style="width:60px;height:60px;" /></span>`;
    };
    reader.readAsDataURL(editSelectedFile);
  });

  document.getElementById('closeEditModalBtn').addEventListener('click', () => closeModal('editProfileModalOverlay'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('editProfileSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const formData = new FormData();
    formData.append('fullName', document.getElementById('editFullName').value.trim());
    formData.append('username', document.getElementById('editUsername').value.trim());
    formData.append('bio', document.getElementById('editBio').value.trim());
    if (editSelectedFile) formData.append('profileImage', editSelectedFile);

    try {
      const data = await apiRequest('/users/update', { method: 'PUT', body: formData, isFormData: true });
      Storage.setUser(data.user);
      showToast('Profile updated', 'success');
      closeModal('editProfileModalOverlay');
      loadProfile();
      const navSlot = document.getElementById('navAvatarSlot');
      if (navSlot) navSlot.innerHTML = avatarHTML({ imagePath: data.user.profileImage, name: data.user.username, size: 32, ring: true });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  });
}

function openEditProfileModal(user) {
  editSelectedFile = null;
  document.getElementById('editAvatarSlot').innerHTML = avatarHTML({ imagePath: user.profileImage, name: user.username, size: 60, ring: true });
  document.getElementById('editFullName').value = user.fullName || '';
  document.getElementById('editUsername').value = user.username || '';
  document.getElementById('editBio').value = user.bio || '';
  openModal('editProfileModalOverlay');
}

/* ---------------------------------------------------------
   Followers / Following modal
   --------------------------------------------------------- */
function wireFollowListModal() {
  const followersStat = document.getElementById('statFollowersBtn');
  const followingStat = document.getElementById('statFollowingBtn');
  if (followersStat) followersStat.addEventListener('click', () => openFollowListModal('followers'));
  if (followingStat) followingStat.addEventListener('click', () => openFollowListModal('following'));

  const closeBtn = document.getElementById('closeFollowListModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('followListModalOverlay'));
}

async function openFollowListModal(type) {
  document.getElementById('followListModalTitle').textContent = type === 'followers' ? 'Followers' : 'Following';
  const body = document.getElementById('followListModalBody');
  body.innerHTML = `<span class="spinner"></span>`;
  openModal('followListModalOverlay');

  try {
    const data = await apiRequest(`/users/${viewedUserId}/${type}`);
    const list = data[type];
    if (!list.length) {
      body.innerHTML = `<div class="empty-state"><p>No ${type} yet</p></div>`;
      return;
    }
    body.innerHTML = list
      .map(
        (u) => `
      <a class="user-list-row" href="profile.html?id=${u._id}">
        ${avatarHTML({ imagePath: u.profileImage, name: u.username, size: 40, ring: true })}
        <div class="user-list-info">
          <div class="username">${escapeHtml(u.username)}</div>
          <div class="full-name">${escapeHtml(u.fullName || '')}</div>
        </div>
      </a>`
      )
      .join('');
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

/* ---------------------------------------------------------
   Post detail modal (image + caption + comments + like)
   --------------------------------------------------------- */
function wirePostDetailModal() {
  const closeBtn = document.getElementById('closePostDetailModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('postDetailModalOverlay'));
}

async function openPostDetailModal(postId) {
  const body = document.getElementById('postDetailModalBody');
  body.innerHTML = `<span class="spinner"></span>`;
  openModal('postDetailModalOverlay');

  try {
    const [postData, commentsData] = await Promise.all([
      apiRequest(`/posts/${postId}`),
      apiRequest(`/comments/${postId}`),
    ]);
    renderPostDetail(postData.post, commentsData.comments);
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function renderPostDetail(post, comments) {
  const body = document.getElementById('postDetailModalBody');
  const author = post.userId;
  const isOwn = author._id === currentUser._id;

  body.innerHTML = `
    <div class="post-detail-grid">
      <div class="post-detail-media"><img src="${resolveImage(post.image)}" alt="Post" /></div>
      <div class="post-detail-side">
        <div class="post-header" style="padding:16px;">
          ${avatarHTML({ imagePath: author.profileImage, name: author.username, size: 34, ring: true })}
          <div class="post-header-meta">
            <span class="username">${escapeHtml(author.username)}</span>
            <div class="time-ago">${timeAgo(post.createdAt)}</div>
          </div>
          ${isOwn ? `<button class="btn btn-sm btn-danger" id="detailDeleteBtn">Delete</button>` : ''}
        </div>
        <div class="post-comments-list" id="detailCommentsList">
          ${post.caption ? `<div class="post-comment-row"><span class="username">${escapeHtml(author.username)}</span>${escapeHtml(post.caption)}</div>` : ''}
          ${comments
            .map((c) => `<div class="post-comment-row"><a class="username" href="profile.html?id=${c.userId._id}">${escapeHtml(c.userId.username)}</a>${escapeHtml(c.comment)}</div>`)
            .join('')}
        </div>
        <div style="padding:0 16px;">
          <button class="btn-icon like-btn ${post.isLiked ? 'liked' : ''}" id="detailLikeBtn">
            <svg viewBox="0 0 24 24" fill="${post.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.2 4.5 5.7 4c2-.3 3.9.7 6.3 3 2.4-2.3 4.3-3.3 6.3-3 3.5.5 5.3 4.1 3.7 7.7C19.5 16.4 12 21 12 21z"/></svg>
          </button>
          <div class="post-likes-count" id="detailLikesCount">${post.likesCount} ${post.likesCount === 1 ? 'like' : 'likes'}</div>
        </div>
        <div class="post-add-comment" style="padding:14px 16px;">
          <input type="text" placeholder="Add a comment..." id="detailCommentInput" maxlength="500" />
          <button id="detailCommentSubmit">Post</button>
        </div>
      </div>
    </div>`;

  document.getElementById('detailLikeBtn').addEventListener('click', async () => {
    try {
      const data = await apiRequest(`/posts/like/${post._id}`, { method: 'POST' });
      const btn = document.getElementById('detailLikeBtn');
      btn.classList.toggle('liked', data.liked);
      btn.querySelector('svg').setAttribute('fill', data.liked ? 'currentColor' : 'none');
      document.getElementById('detailLikesCount').textContent = `${data.likesCount} ${data.likesCount === 1 ? 'like' : 'likes'}`;
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const input = document.getElementById('detailCommentInput');
  const submit = async () => {
    const text = input.value.trim();
    if (!text) return;
    try {
      const data = await apiRequest(`/comments/${post._id}`, { method: 'POST', body: { comment: text } });
      input.value = '';
      document.getElementById('detailCommentsList').insertAdjacentHTML(
        'beforeend',
        `<div class="post-comment-row"><a class="username" href="profile.html?id=${data.comment.userId._id}">${escapeHtml(data.comment.userId.username)}</a>${escapeHtml(data.comment.comment)}</div>`
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  document.getElementById('detailCommentSubmit').addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });

  if (isOwn) {
    document.getElementById('detailDeleteBtn').addEventListener('click', async () => {
      if (!confirm('Delete this post? This cannot be undone.')) return;
      try {
        await apiRequest(`/posts/${post._id}`, { method: 'DELETE' });
        closeModal('postDetailModalOverlay');
        showToast('Post deleted', 'success');
        loadProfile();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}
