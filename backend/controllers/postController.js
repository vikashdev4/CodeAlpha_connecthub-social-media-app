const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// Attaches lightweight author info + like/comment counts to a post for the feed
const populatePost = (query) =>
  query.populate('userId', 'username profileImage fullName').sort({ createdAt: -1 });

// @route   POST /api/posts/create
// @desc    Create a new post (image required, caption optional)
const createPost = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'An image is required to create a post' });
    }

    const post = await Post.create({
      userId: req.user._id,
      image: `/uploads/${req.file.filename}`,
      caption: req.body.caption || '',
    });

    const populated = await Post.findById(post._id).populate('userId', 'username profileImage fullName');

    res.status(201).json({ success: true, message: 'Post created', post: populated });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/feed
// @desc    Latest posts first, from everyone (simple global feed)
const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await populatePost(Post.find()).skip(skip).limit(limit);

    const total = await Post.countDocuments();

    // Mark which posts the current user has liked, for instant heart state on the frontend
    const postsWithLikeState = posts.map((post) => ({
      ...post.toObject(),
      likesCount: post.likes.length,
      isLiked: post.likes.some((id) => id.toString() === req.user._id.toString()),
    }));

    res.json({
      success: true,
      posts: postsWithLikeState,
      page,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/user/:userId
// @desc    All posts belonging to one user (used on the profile grid)
const getUserPosts = async (req, res, next) => {
  try {
    const posts = await populatePost(Post.find({ userId: req.params.userId }));
    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/:id
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('userId', 'username profileImage fullName');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({
      success: true,
      post: {
        ...post.toObject(),
        likesCount: post.likes.length,
        isLiked: post.likes.some((id) => id.toString() === req.user._id.toString()),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/posts/:id
// @desc    Delete a post — only the owner may do this
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }

    await Comment.deleteMany({ postId: post._id });
    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/posts/like/:id
// @desc    Toggle like / unlike on a post
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === req.user._id.toString());

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);

      // Don't notify yourself when you like your own post
      if (post.userId.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.userId,
          sender: req.user._id,
          type: 'like',
          post: post._id,
        });
      }
    }

    await post.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, getFeed, getUserPosts, getPostById, deletePost, toggleLike };
