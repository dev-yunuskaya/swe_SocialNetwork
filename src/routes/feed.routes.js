const express = require('express');
const { authenticate } = require('../middleware/auth');
const feedService = require('../services/feed.service');
const { parseExcludeIds } = require('../utils/query');

const router = express.Router();

router.get('/feed', authenticate, async (req, res, next) => {
  try {
    const excludeIds = parseExcludeIds(req.query.exclude);
    const feed = await feedService.getFeed(req.user.id, {
      cursor: req.query.cursor,
      excludeIds,
      limit: 10,
    });
    res.status(200).json(feed);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
