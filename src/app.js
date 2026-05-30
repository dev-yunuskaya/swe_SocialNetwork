require('dotenv').config();
const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const followRoutes = require('./routes/follow.routes');
const postRoutes = require('./routes/post.routes');
const feedRoutes = require('./routes/feed.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api', authRoutes);
  app.use('/api', profileRoutes);
  app.use('/api', followRoutes);
  app.use('/api', postRoutes);
  app.use('/api', feedRoutes);
  app.use('/api', recommendationRoutes);
  app.use('/api', messageRoutes);
  app.use('/api', notificationRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
