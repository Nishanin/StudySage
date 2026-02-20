const MessageModel = require("../../models/messageModel");
const messageModel = new MessageModel();

async function saveUserMessage(resource_id, content) {
  if (!content || !content.trim()) return;
  await messageModel.createMessage({ resource_id, role: "user", content });
}

async function saveAssistantMessage(resource_id, content) {
  if (!content || !content.trim()) return;
  await messageModel.createMessage({ resource_id, role: "assistant", content });
}

async function getConversationHistory(resource_id) {
  const messages = await messageModel.getRecentMessages(resource_id, 4);

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
