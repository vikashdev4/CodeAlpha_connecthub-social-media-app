# 🚀 ConnectHub – Social Media App

ConnectHub is a modern Instagram-inspired full-stack social media platform built for internship submission.  
It includes a **dark UI, authentication system, posts, likes, comments, followers system, and MongoDB Atlas backend**.

---

## 🌐 Live Demo

👉 Local Run:
```
http://localhost:5000
```

👉 GitHub Repository:
```
https://github.com/vikashdev4/CodeAlpha_connecthub-social-media-app
```

---

## 🧠 Tech Stack

### Frontend
- HTML5
- CSS3 (Dark UI + Glassmorphism)
- Vanilla JavaScript

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Multer (image uploads)
- bcryptjs

---

## 📁 Clean Project Structure

```
ConnectHub/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── feed.html
│   │   ├── profile.html
│   │   └── create-post.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/connecthub.git
cd connecthub/backend
```

---

### 2. Install Dependencies
```bash
npm install
```

---

### 3. Setup Environment Variables

Create `.env` file inside backend:

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/connecthub
JWT_SECRET=your_secret_key
```

---

### 4. Run Server
```bash
npm start
```

Server will start at:
```
http://localhost:5000
```

---

## ✨ Features

### 🔐 Authentication
- Register / Login system
- JWT token authentication
- Password encryption (bcryptjs)

### 👤 User System
- Profile creation
- Edit profile (bio, username, image)
- Follow / Unfollow users
- Followers & Following list

### 📝 Posts System
- Create posts (image + caption)
- Delete own posts
- Like / Unlike posts
- Comment system

### 🔎 Social Features
- User search
- Notifications system
- Real-time feed (latest posts first)

### 🎨 UI/UX
- Dark mode design
- Glassmorphism navbar
- Gradient story rings
- Fully responsive design
- Smooth animations

---

## 🗄️ Database Models

### User
```
username, email, password, fullName, profileImage, bio,
followers[], following[], createdAt
```

### Post
```
userId, image, caption, likes[], commentsCount
```

### Comment
```
postId, userId, comment, createdAt
```

### Notification
```
recipient, sender, type, post, read
```

---

## 🚀 API Routes

| Method | Endpoint | Description |
|------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/posts/feed | Get feed |
| POST | /api/posts/create | Create post |
| POST | /api/posts/like/:id | Like/Unlike post |
| POST | /api/comments/:postId | Add comment |
| GET | /api/users/search | Search users |
| POST | /api/users/follow/:id | Follow user |
| POST | /api/users/unfollow/:id | Unfollow user |

---

## 💡 Notes

- Backend serves frontend directly (no separate server needed)
- Works with Live Server (CORS enabled)
- MongoDB Atlas required for full functionality
- JWT used for authentication security

---

## 👨‍💻 Author

**Vikash Dhakad**  
Full Stack Internship Project – ConnectHub
