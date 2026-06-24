# 🌐 ConnectHub

ConnectHub is a full-stack social media platform inspired by Instagram, built using Node.js, Express, MongoDB, and Vanilla JavaScript. It demonstrates real-world backend architecture, authentication flow, and a modern responsive UI with a dark-first design system.

This project was developed as part of an internship submission to showcase practical full-stack development skills.

---

## 🚀 Tech Stack

### Frontend
- HTML5
- CSS3 (Dark UI, Glassmorphism, Gradient Effects)
- Vanilla JavaScript (No frameworks)

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Multer (File Uploads)
- bcryptjs (Password Hashing)

---

## 📁 Project Structure

social-media-app/
│
├── backend/
│   ├── config/           # Database connection
│   ├── controllers/      # Business logic
│   ├── middleware/       # Auth & error handling
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── uploads/          # Uploaded media
│   ├── server.js         # Main server file
│   └── .env.example
│
└── frontend/
    ├── pages/            # UI pages (login, feed, profile)
    ├── css/              # Styling files
    ├── js/               # Frontend logic
    └── assets/

---

## ⚙️ Setup & Installation

### 1. Install dependencies
cd backend
npm install

---

### 2. Environment variables

Create a `.env` file inside backend:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_ORIGIN=http://127.0.0.1:5500

---

### 3. Run the project

npm start

Server runs at:
http://localhost:5000

Open in browser:
http://localhost:5000/pages/login.html

---

## ✨ Features

🔐 Authentication System
- Register/Login
- JWT authentication
- Secure password hashing

👤 User System
- Profile creation & editing
- Profile image upload
- Followers / following system

📝 Posts System
- Create posts with image + caption
- Like / unlike posts
- Delete own posts
- Infinite scroll feed

💬 Social Features
- Comments system
- User search
- Notifications (follow, like, comment)

🎨 UI/UX Design
- Dark mode UI
- Glassmorphism navbar
- Instagram-style gradient avatar rings
- Smooth animations
- Fully responsive design

---

## 🗄️ Database Models

User:
- username, email, password
- profileImage, bio
- followers, following

Post:
- image, caption
- likes, commentsCount
- user reference

Comment:
- postId, userId, text

Notification:
- sender, recipient
- type (like/follow/comment)
- read status

---

## 🔌 API Endpoints

Base URL:
/api

Auth:
- POST /auth/register
- POST /auth/login
- GET /auth/me

Users:
- GET /users/:id
- PUT /users/update
- POST /users/follow/:id
- POST /users/unfollow/:id

Posts:
- POST /posts/create
- GET /posts/feed
- POST /posts/like/:id

Comments:
- POST /comments/:postId

Notifications:
- GET /notifications

---

## 🎯 Highlights

- Full-stack working social media app
- Clean MVC backend structure
- JWT authentication system
- Real-world REST API design
- Responsive dark UI
- Internship-ready project

---

## 📌 Future Improvements

- Real-time chat (WebSockets)
- Stories feature
- Video upload support
- Deployment on Render / Vercel
- React frontend upgrade

---

## 👨‍💻 Author

Full-stack internship project demonstrating backend + frontend development skills.

---
