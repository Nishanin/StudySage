const axios = require("axios");

async function generateAnswer({
  system_prompt,
  context_chunks,
  user_message,
  chat_history,
}) {
  try {
    const baseUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    const response = await axios.post(
      `${baseUrl}/generate/chat`,
      {
        system_prompt,
        context_chunks,
        user_message,
        chat_history,
      },
      { timeout: 60000 },
    );

    if (response.data && typeof response.data.answer === "string") {
      return response.data.answer;
    }

    throw new Error("Invalid response from ML service");
  } catch (err) {
    if (err.response) {
      console.error("ML service error response:", err.response.data);
    } else {
      console.error("ML service error:", err.message);
    }
    throw new Error("Failed to generate answer from ML service");
  }
}

module.exports = { generateAnswer };
