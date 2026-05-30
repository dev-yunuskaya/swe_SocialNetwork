const express = require('express');
const authService = require('../services/auth.service');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
