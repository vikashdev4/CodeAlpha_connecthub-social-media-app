const Notification = require('../models/Notification');

// @route   GET /api/notifications
// @desc    Get the logged-in user's notifications, newest first
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username profileImage')
      .populate('post', 'image')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/notifications/read
// @desc    Mark all of the logged-in user's notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAllAsRead };
