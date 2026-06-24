const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @route   POST /api/comments/:postId
// @desc    Add a comment to a post
const addComment = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const newComment = await Comment.create({
      postId: post._id,
      userId: req.user._id,
      comment: comment.trim(),
    });

    post.commentsCount += 1;
    await post.save();

    if (post.userId.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.userId,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
      });
    }

    const populated = await Comment.findById(newComment._id).populate('userId', 'username profileImage');

    res.status(201).json({ success: true, comment: populated, commentsCount: post.commentsCount });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/comments/:postId
// @desc    List all comments on a post, oldest first
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('userId', 'username profileImage')
      .sort({ createdAt: 1 });

    res.json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments };
