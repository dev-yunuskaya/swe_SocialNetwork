const express = require('express');
const { authenticate } = require('../middleware/auth');
const followService = require('../services/follow.service');

const router = express.Router();

router.post('/users/:id/follow', authenticate, async (req, res, next) => {
  try {
    const result = await followService.follow(req.user.id, Number(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id/follow', authenticate, async (req, res, next) => {
  try {
    const result = await followService.unfollow(req.user.id, Number(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
