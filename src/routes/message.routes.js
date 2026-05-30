const express = require('express');
const { authenticate } = require('../middleware/auth');
const messageService = require('../services/message.service');

const router = express.Router();

router.get('/messages', authenticate, async (req, res, next) => {
  try {
    const conversations = await messageService.listConversations(req.user.id);
    res.status(200).json(conversations);
  } catch (err) {
    next(err);
  }
});

router.post('/messages', authenticate, async (req, res, next) => {
  try {
    const message = await messageService.sendMessage(
      req.user.id,
      Number(req.body.recipient_id),
      req.body.content
    );
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

router.get('/messages/:partner_id', authenticate, async (req, res, next) => {
  try {
    const messages = await messageService.getConversation(
      req.user.id,
      Number(req.params.partner_id)
    );
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
