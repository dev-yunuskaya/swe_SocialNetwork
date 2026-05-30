const express = require('express');
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notification.service');

const router = express.Router();

router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const notifications = await notificationService.listNotifications(req.user.id);
    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
});

router.patch('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
