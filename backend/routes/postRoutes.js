const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeed,
  getUserPosts,
  getPostById,
  deletePost,
  toggleLike,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/create', protect, upload.single('image'), createPost);
router.get('/feed', protect, getFeed);
router.get('/user/:userId', protect, getUserPosts);
router.post('/like/:id', protect, toggleLike);
router.get('/:id', protect, getPostById);
router.delete('/:id', protect, deletePost);

module.exports = router;
