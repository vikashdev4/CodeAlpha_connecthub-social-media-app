/* =========================================================
   ConnectHub — ui.js
   Shared chrome used on every logged-in page: navbar search,
   notifications dropdown, profile dropdown, toasts, modals,
   avatar rendering and the relative "time ago" formatter.
   ========================================================= */

/* ---------- Small formatting helpers ---------- */

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initials(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const units = [
    { label: 'y', secs: 31536000 },
    { label: 'w', secs: 604800 },
    { label: 'd', secs: 86400 },
    { label: 'h', secs: 3600 },
    { label: 'm', secs: 60 },
  ];
  for (const u of units) {
    const value = Math.floor(seconds / u.secs);
    if (value >= 1) return `${value}${u.label}`;
  }
  return 'now';
}

/**
 * Builds avatar markup. If imagePath is falsy, renders a gradient-backed
 * initials circle instead, so the app never shows a broken image icon.
 */
function avatarHTML({ imagePath, name, size = 36, ring = false }) {
  const src = resolveImage(imagePath);
  const inner = src
    ? `<img class="avatar" src="${src}" alt="${escapeHtml(name || '')}" style="width:${size}px;height:${size}px;" />`
    : `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px;">${initials(name)}</div>`;

  if (!ring) return inner;
  return `<span class="avatar-ring">${inner}</span>`;
}

/* ---------- Toasts ---------- */

function ensureToastStack() {
  let stack = document.getElementById('toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = 'info') {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

/* ---------- Modals ---------- */

function openModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) overlay.classList.add('open');
}

function closeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) overlay.classList.remove('open');
}

// Click outside the modal box (on the overlay) closes it
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ---------- Navbar: search, notifications, profile menu ---------- */

let searchDebounceTimer = null;

function initNavbar() {
  const user = Storage.getUser();
  if (!user) return;

  // Profile avatar in navbar + dropdown
  const navAvatarSlot = document.getElementById('navAvatarSlot');
  if (navAvatarSlot) {
    navAvatarSlot.innerHTML = avatarHTML({ imagePath: user.profileImage, name: user.username, size: 32, ring: true });
  }

  const profileDropdownName = document.getElementById('dropdownUsername');
  if (profileDropdownName) profileDropdownName.textContent = `@${user.username}`;

  wireDropdown('profileBtn', 'profileDropdown');
  wireDropdown('notifBtn', 'notifDropdown', loadNotifications);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const myProfileLink = document.getElementById('myProfileLink');
  if (myProfileLink) myProfileLink.href = `profile.html?id=${user._id}`;

  // Search
  const searchInput = document.getElementById('navbarSearchInput');
  const searchResults = document.getElementById('searchResults');
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      const q = searchInput.value.trim();
      if (!q) {
        searchResults.classList.remove('open');
        return;
      }
      searchDebounceTimer = setTimeout(() => runSearch(q, searchResults), 280);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('open');
      }
    });
  }

  loadNotifications();
  highlightBottomNav();
}

function wireDropdown(btnId, panelId, onOpen) {
  const btn = document.getElementById(btnId);
  const panel = document.getElementById(panelId);
  if (!btn || !panel) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !panel.classList.contains('open');
    document.querySelectorAll('.dropdown-panel.open').forEach((p) => p.classList.remove('open'));
    if (willOpen) {
      panel.classList.add('open');
      if (onOpen) onOpen();
    }
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
}

async function runSearch(query, container) {
  try {
    const data = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
    if (!data.users.length) {
      container.innerHTML = `<div class="search-empty">No users found for "${escapeHtml(query)}"</div>`;
    } else {
      container.innerHTML = data.users
        .map(
          (u) => `
        <a class="search-result-item" href="profile.html?id=${u._id}">
          ${avatarHTML({ imagePath: u.profileImage, name: u.username, size: 34 })}
          <div>
            <div style="font-weight:600;font-size:13.5px;">${escapeHtml(u.username)}</div>
            <div class="text-muted" style="font-size:12px;">${escapeHtml(u.fullName || '')}</div>
          </div>
        </a>`
        )
        .join('');
    }
    container.classList.add('open');
  } catch (err) {
    console.error(err);
  }
}

async function loadNotifications() {
  const list = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  if (!list) return;

  try {
    const data = await apiRequest('/notifications');

    if (badge) badge.style.display = data.unreadCount > 0 ? 'block' : 'none';

    if (!data.notifications.length) {
      list.innerHTML = `<div class="search-empty">No notifications yet</div>`;
      return;
    }

    list.innerHTML = data.notifications
      .map((n) => {
        const verb = n.type === 'follow' ? 'started following you' : n.type === 'like' ? 'liked your post' : 'commented on your post';
        return `
        <a class="dropdown-item" href="profile.html?id=${n.sender._id}">
          ${avatarHTML({ imagePath: n.sender.profileImage, name: n.sender.username, size: 34 })}
          <span><strong>${escapeHtml(n.sender.username)}</strong> ${verb} · <span class="text-muted">${timeAgo(n.createdAt)}</span></span>
        </a>`;
      })
      .join('');

    if (data.unreadCount > 0) {
      apiRequest('/notifications/read', { method: 'PUT' }).catch(() => {});
    }
  } catch (err) {
    list.innerHTML = `<div class="search-empty">Couldn't load notifications</div>`;
  }
}

function highlightBottomNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.bottom-nav a[data-page]').forEach((a) => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}
