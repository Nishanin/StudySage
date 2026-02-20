const { searchChunks } = require("../services/chatbot/retrievalService");
const memory = require("../services/chatbot/memoryService");
const { getEmbedding } = require("../services/chatbot/embeddingService");
const { generateAnswer } = require("../services/chatbot/llmService");

async function chatMessage(req, res) {
  try {
    const { message, resource_id, context } = req.body || {};

    if (!message || !resource_id) {
      return res.status(400).json({
        success: false,
        error: { message: "message and resource_id are required" },
      });
    }

    const embedding = await getEmbedding(message);

    if (!Array.isArray(embedding) || embedding.length !== 384) {
      return res.status(500).json({
        success: false,
        error: { message: "Embedding generation failed" },
      });
    }

    const history = await memory.getConversationHistory(resource_id);

    const chunks = await searchChunks({ embedding, resource_id, context });

    const systemPrompt = "You are a helpful academic study assistant.";

    let answer;

    if (!chunks.length) {
      answer = "The material does not contain that information.";
    } else {
      answer = await generateAnswer({
        system_prompt: systemPrompt,
        context_chunks: chunks.map((c) => c.text),
        user_message: message,
        chat_history: history,
      });
    }

    await memory.saveUserMessage(resource_id, message);
    await memory.saveAssistantMessage(resource_id, answer);

    return res.json({
      success: true,
      answer,
      chunks,
    });
  } catch (err) {
    console.error("[CHAT ERROR]", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Internal error" },
    });
  }
}

module.exports = { chatMessage };
