const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  searchUsers,
  getFollowers,
  getFollowing,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// NOTE: /search must be declared before the /:id route, otherwise Express
// would treat "search" as a user id and the lookup would 404.
router.get('/search', protect, searchUsers);

router.put('/update', protect, upload.single('profileImage'), updateProfile);
router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);
router.get('/:id/followers', protect, getFollowers);
router.get('/:id/following', protect, getFollowing);
router.get('/:id', protect, getUserProfile);

module.exports = router;
