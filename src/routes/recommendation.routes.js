const express = require('express');
const { authenticate } = require('../middleware/auth');
const recommendationService = require('../services/recommendation.service');
const { parseExcludeIds } = require('../utils/query');

const router = express.Router();

router.get('/recommendations', authenticate, async (req, res, next) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const seed = req.query.seed ? Number(req.query.seed) : undefined;
    const excludeIds = parseExcludeIds(req.query.exclude);
    const recommendations = await recommendationService.recommend(req.user.id, 12, {
      refresh,
      seed,
      excludeIds,
    });
    res.status(200).json(recommendations);
  } catch (err) {
    next(err);
  }
});

router.post('/recommendations/refresh', authenticate, async (req, res, next) => {
  try {
    const excludeIds = parseExcludeIds(req.body?.exclude);
    const seed = req.body?.seed != null ? Number(req.body.seed) : Date.now();
    const recommendations = await recommendationService.recommend(req.user.id, 12, {
      refresh: true,
      seed,
      excludeIds,
    });
    res.status(200).json(recommendations);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
