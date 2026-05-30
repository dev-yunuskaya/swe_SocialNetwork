const { prisma } = require('../lib/prisma');
const { httpError } = require('../middleware/errorHandler');

async function listNotifications(userId) {
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    include: { actor: { select: { username: true } } },
    orderBy: { created_at: 'desc' },
  });

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    actor_username: n.actor.username,
    post_id: n.post_id,
    is_read: n.is_read,
    created_at: n.created_at,
  }));
}

async function markAsRead(userId, notificationId) {
  if (notificationId === 'all') {
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return { message: 'All notifications marked as read' };
  }

  const notification = await prisma.notification.findFirst({
    where: { id: Number(notificationId), user_id: userId },
  });
  if (!notification) {
    throw httpError(404, 'Notification not found');
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { is_read: true },
  });

  return { message: 'Notification marked as read' };
}

module.exports = { listNotifications, markAsRead };
