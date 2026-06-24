const express = require('express');
const router = express.Router();
const { getNotifications, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/read', protect, markAllAsRead);

module.exports = router;
