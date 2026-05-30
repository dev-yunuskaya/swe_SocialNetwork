const express = require('express');
const { authenticate } = require('../middleware/auth');
const { optionalAuthenticate } = require('../middleware/optionalAuth');
const profileService = require('../services/profile.service');

const router = express.Router();

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(String(req.user.id), req.user.id);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

router.get('/users/:identifier', optionalAuthenticate, async (req, res, next) => {
  try {
    const viewerId = req.user?.id;
    const profile = await profileService.getProfile(req.params.identifier, viewerId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const profile = await profileService.updateProfile(req.user.id, req.body);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
