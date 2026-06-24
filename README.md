# ConnectHub

A full-stack, Instagram-inspired social media platform built for an internship submission.
Dark-mode-first UI, gradient "story ring" avatars, glassmorphic navbar, and a complete
Node/Express/MongoDB backend with JWT authentication.

> Tech stack: **HTML5 / CSS3 / Vanilla JavaScript** (frontend) · **Node.js / Express.js / MongoDB
> Atlas / Mongoose / JWT** (backend).

---

## 1. Folder structure

```
social-media-app/
├── backend/
│   ├── config/db.js                 # Mongoose connection
│   ├── controllers/                 # Route handler logic
│   ├── middleware/                  # auth (JWT), upload (multer), error handler
│   ├── models/                      # User, Post, Comment, Notification
│   ├── routes/                      # Express routers
│   ├── uploads/                     # Uploaded images land here (served at /uploads/*)
│   ├── server.js                    # App entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── pages/
    │   ├── login.html
    │   ├── register.html
    │   ├── feed.html
    │   ├── profile.html
    │   └── create-post.html
    ├── css/
    │   ├── style.css                # Design tokens, navbar, forms, modals, toasts
    │   ├── feed.css                 # Stories bar, post cards, create-post page
    │   └── profile.css              # Profile header, stats, post grid
    ├── js/
    │   ├── api.js                   # fetch wrapper + token storage (shared)
    │   ├── ui.js                    # navbar, toasts, modals, avatars (shared)
    │   ├── auth.js                  # login.html + register.html
    │   ├── feed.js                  # feed.html
    │   ├── profile.js               # profile.html
    │   └── post.js                  # create-post.html
    └── assets/
```

`api.js` and `ui.js` aren't in the original brief's file list — they were added so the
four required JS files don't each re-implement fetch/token handling, toasts, modals and
avatar rendering. Every page that needs them loads `api.js` then `ui.js` before its own
script (see the `<script>` tags at the bottom of each HTML file).

---

## 2. Setup & running locally

### Requirements
- Node.js 18+
- A MongoDB Atlas cluster (free tier is enough) — or any reachable MongoDB instance

### Steps

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/connecthub?retryWrites=true&w=majority
JWT_SECRET=some_long_random_string
```

Then start the server:

```bash
npm start          # or: npm run dev   (auto-restarts with nodemon)
```

You'll see:

```
✅ MongoDB connected: <your-cluster-host>
🚀 ConnectHub server running on http://localhost:5000
```

**That's it — open `http://localhost:5000` in your browser.** The Express server
serves the `frontend/` folder directly (see `server.js`), so there's no second
server, no CORS setup, and no build step. The root URL redirects to the login page.

If you'd rather run the frontend from a separate static server (e.g. VS Code's "Live
Server" on port 5500), it still works: set `CLIENT_ORIGIN` in `.env` to match that
origin so CORS allows it. The frontend always calls the API at the absolute URL
`http://localhost:5000/api` (see `API_BASE` in `frontend/js/api.js`) — update that
constant if you change `PORT`.

### Creating your first account
Go to `/pages/register.html`, sign up, and you'll be redirected straight into the feed.
Register a second account in another browser/incognito window to test following,
liking, and commenting between two users.

---

## 3. Feature checklist (against the brief)

| Area | Status | Notes |
|---|---|---|
| Register / Login / Logout | ✅ | JWT issued on register & login, stored in `localStorage` |
| Password hashing | ✅ | `bcryptjs` (see note below), 10 salt rounds |
| Protected routes | ✅ | `middleware/auth.js` verifies the Bearer token on every API route except register/login |
| Profile photo upload | ✅ | `multer` → `/uploads`, edited via the Edit Profile modal |
| Bio / username / full name editing | ✅ | `PUT /api/users/update` |
| Followers / following counts + lists | ✅ | Modal list view, populated from `User.followers` / `User.following` |
| Create post (image + caption) | ✅ | `create-post.html`, drag-and-drop or click to upload |
| Delete own posts | ✅ | Post menu (feed) and post detail modal (profile) — owner only, enforced server-side |
| Feed, latest-first | ✅ | `GET /api/posts/feed`, paginated, infinite scroll via `IntersectionObserver` |
| Time-ago display | ✅ | `timeAgo()` in `ui.js` |
| Comments (add/view/count) | ✅ | Inline on feed cards and in the post detail modal |
| Like / unlike + heart animation | ✅ | Toggle endpoint, double-tap-to-like, burst + pop animations |
| Search users | ✅ | Live dropdown in the navbar, debounced, `GET /api/users/search?q=` |
| Notifications (follow/like/comment) | ✅ | Bell icon dropdown, unread badge, marked read on open |
| Toasts, spinners, skeletons, empty states, form validation | ✅ | See `style.css` / `feed.css` |
| Dark mode | ✅ | Default and only theme, per the brief |
| Responsive (mobile/tablet/desktop) | ✅ | Bottom tab bar under 768px, fluid grid/profile layout |

### Deliberate, documented deviations from the brief
- **bcryptjs instead of bcrypt.** Same hashing algorithm and API; `bcryptjs` is pure
  JavaScript so it never needs native compilation, which makes `npm install` reliable
  across OSes. Swap it for `bcrypt` if you prefer — only `authController.js` touches it.
- **`GET /api/auth/me`, `GET /api/posts/user/:userId`, `GET /api/users/search`,
  `GET /api/users/:id/followers`, `GET /api/users/:id/following`, and the
  `notifications` routes** were added beyond the brief's endpoint list because the
  UI genuinely needs them (restoring a session, the profile grid, live search, the
  followers/following modal, and the notification bell all call these).
- **Stories bar** is a presentational UI element built from the people you follow
  (it links to their profiles) rather than a real "Story" feature — the brief's database
  schema doesn't define a Story collection, so no story content/expiry logic exists.
- **Notifications are listed and marked read**, but there's no live/websocket push;
  they're fetched when the bell dropdown opens.

---

## 4. API reference

All endpoints are under `/api`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Create an account |
| POST | `/auth/login` | – | Log in with email **or** username |
| GET | `/auth/me` | ✅ | Get the logged-in user |
| GET | `/users/:id` | ✅ | Public profile + posts |
| PUT | `/users/update` | ✅ | Edit profile (multipart: `profileImage`, `bio`, `fullName`, `username`) |
| POST | `/users/follow/:id` | ✅ | Follow a user |
| POST | `/users/unfollow/:id` | ✅ | Unfollow a user |
| GET | `/users/search?q=` | ✅ | Search usernames |
| GET | `/users/:id/followers` | ✅ | List followers |
| GET | `/users/:id/following` | ✅ | List following |
| POST | `/posts/create` | ✅ | Create a post (multipart: `image`, `caption`) |
| GET | `/posts/feed?page=&limit=` | ✅ | Global feed, newest first |
| GET | `/posts/user/:userId` | ✅ | One user's posts |
| GET | `/posts/:id` | ✅ | Single post |
| DELETE | `/posts/:id` | ✅ | Delete own post |
| POST | `/posts/like/:id` | ✅ | Toggle like |
| POST | `/comments/:postId` | ✅ | Add a comment |
| GET | `/comments/:postId` | ✅ | List comments |
| GET | `/notifications` | ✅ | List notifications + unread count |
| PUT | `/notifications/read` | ✅ | Mark all as read |

---

## 5. Database collections

```js
User {
  username, email, password (hashed), fullName, profileImage, bio,
  followers: [User], following: [User], createdAt, updatedAt
}

Post {
  userId: User, image, caption, likes: [User], commentsCount, createdAt, updatedAt
}

Comment {
  postId: Post, userId: User, comment, createdAt, updatedAt
}

Notification {
  recipient: User, sender: User, type: 'follow'|'like'|'comment',
  post: Post | null, read, createdAt, updatedAt
}
```

---

## 6. Design notes

- **Palette:** near-black surfaces (`#0a0a0f` / `#15151c`) with the classic Instagram
  orange → pink → purple gradient (`#ff7a3d → #e1306c → #8a3ab9`) reserved for the logo,
  primary buttons, and the signature "story ring" around avatars.
- **Type:** `Outfit` for headings/the logo wordmark, `Inter` for everything else.
- **Signature element:** the gradient story-ring avatar, reused consistently in the
  navbar, post headers, the stories bar, and the profile header.
- Respects `prefers-reduced-motion` and visible keyboard focus states throughout.
