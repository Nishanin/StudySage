const { searchChunks } = require("../services/chatbot/retrievalService");
const memory = require("../services/chatbot/memoryService");
const { buildPrompt } = require("../services/chatbot/promptService");

async function chatMessage(req, res) {
  try {
    const { message, resource_id, context } = req.body || {};
    if (!message || !resource_id) {
      return res.status(400).json({
        success: false,
        error: { message: "message and resource_id are required" },
      });
    }

    await memory.saveUserMessage(resource_id, message);
    const embedding = new Array(1536).fill(0.01);
    const chunks = await searchChunks({ embedding, resource_id, context });
    const history = await memory.getConversationHistory(resource_id);
    const prompt = buildPrompt({
      question: message,
      chunks,
      history,
      context,
    });

    if (process.env.CHAT_DEBUG === "true") {
      console.log("\n====== FINAL PROMPT ======\n");
      console.log(prompt);
      console.log("\n==========================\n");
    }

    let answer;

    if (!chunks.length) {
      answer = "I couldn't find relevant content in this resource.";
    } else {
      answer = "LLM response will appear here";
      await memory.saveAssistantMessage(resource_id, answer);
    }

    return res.json({
      success: true,
      answer,
      chunks,
      debug_prompt: prompt,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Internal error" },
    });
  }
}

module.exports = { chatMessage };
