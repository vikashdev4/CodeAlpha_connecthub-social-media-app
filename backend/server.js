require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// ---------- Core middleware ----------
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically (profile photos + post images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the frontend folder directly, so the whole app can run from one server
// e.g. http://localhost:5000/pages/login.html
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- API routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ConnectHub API is running 🚀' });
});

// Root convenience redirect to the login page when served from this server
app.get('/', (req, res) => {
  res.redirect('/pages/login.html');
});

// ---------- Error handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ConnectHub server running on http://localhost:${PORT}`);
});
