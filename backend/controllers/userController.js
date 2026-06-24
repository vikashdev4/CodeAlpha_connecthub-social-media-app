const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { formatUser } = require('./authController');

// @route   GET /api/users/:id
// @desc    Get a user's public profile + their posts
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });

    const isFollowing = req.user ? user.followers.some((f) => f.toString() === req.user._id.toString()) : false;

    res.json({
      success: true,
      user: { ...formatUser(user), isFollowing, isOwnProfile: req.user ? req.user._id.toString() === user._id.toString() : false },
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/update
// @desc    Edit the logged-in user's profile (bio, fullName, profileImage)
const updateProfile = async (req, res, next) => {
  try {
    const { bio, fullName, username } = req.body;
    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (fullName !== undefined) updates.fullName = fullName;

    if (username !== undefined && username !== req.user.username) {
      const taken = await User.findOne({ username });
      if (taken) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      updates.username = username;
    }

    // Uploaded via multer (single file field "profileImage")
    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Profile updated', user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/follow/:id
// @desc    Follow another user
const followUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyFollowing = targetUser.followers.some((f) => f.toString() === req.user._id.toString());
    if (alreadyFollowing) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    targetUser.followers.push(req.user._id);
    await targetUser.save();

    req.user.following.push(targetUser._id);
    await req.user.save();

    await Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      type: 'follow',
    });

    res.json({ success: true, message: `You are now following ${targetUser.username}` });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/unfollow/:id
// @desc    Unfollow a user
const unfollowUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.followers = targetUser.followers.filter((f) => f.toString() !== req.user._id.toString());
    await targetUser.save();

    req.user.following = req.user.following.filter((f) => f.toString() !== targetUser._id.toString());
    await req.user.save();

    res.json({ success: true, message: `You unfollowed ${targetUser.username}` });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/search?q=
// @desc    Search users by username (used for the navbar live search)
const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
    })
      .select('username fullName profileImage')
      .limit(10);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/:id/followers
const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'username fullName profileImage');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, followers: user.followers });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/:id/following
const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'username fullName profileImage');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, following: user.following });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  searchUsers,
  getFollowers,
  getFollowing,
};
