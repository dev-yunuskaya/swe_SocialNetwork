const { prisma } = require('../lib/prisma');
const { httpError } = require('../middleware/errorHandler');

async function sendMessage(senderId, recipientId, content) {
  if (!content || !content.trim()) {
    throw httpError(400, 'Message cannot be empty');
  }
  if (content.length > 1000) {
    throw httpError(400, 'Message exceeds 1000 characters');
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) {
    throw httpError(404, 'Recipient not found');
  }

  const message = await prisma.message.create({
    data: {
      sender_id: senderId,
      recipient_id: recipientId,
      content: content.trim(),
    },
  });

  return message;
}

async function getConversation(userId, partnerId) {
  const partner = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!partner) {
    throw httpError(404, 'User not found');
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { sender_id: userId, recipient_id: partnerId },
        { sender_id: partnerId, recipient_id: userId },
      ],
    },
    orderBy: { created_at: 'asc' },
  });

  return messages;
}

async function listConversations(userId) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ sender_id: userId }, { recipient_id: userId }],
    },
    orderBy: { created_at: 'desc' },
    include: {
      sender: { select: { id: true, username: true } },
      recipient: { select: { id: true, username: true } },
    },
  });

  const partners = new Map();
  for (const msg of messages) {
    const partner = msg.sender_id === userId ? msg.recipient : msg.sender;
    if (!partners.has(partner.id)) {
      partners.set(partner.id, {
        partner_id: partner.id,
        partner_username: partner.username,
        last_message: msg.content,
        last_at: msg.created_at,
      });
    }
  }

  return [...partners.values()];
}

module.exports = { sendMessage, getConversation, listConversations };
