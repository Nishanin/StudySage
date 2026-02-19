const MessageModel = require("../../models/messageModel");
const messageModel = new MessageModel();

async function saveUserMessage(chat_id, content) {
  if (!content || !content.trim()) return;
  await messageModel.createMessage({ chat_id, role: "user", content });
}

async function saveAssistantMessage(chat_id, content) {
  if (!content || !content.trim()) return;
  await messageModel.createMessage({ chat_id, role: "assistant", content });
}

async function getConversationHistory(chat_id) {
  const messages = await messageModel.getRecentMessages(chat_id, 4);

  if (!Array.isArray(messages)) return [];

  return messages
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((m) => ({ role: m.role, content: m.content }));
}

module.exports = {
  saveUserMessage,
  saveAssistantMessage,
  getConversationHistory,
};
