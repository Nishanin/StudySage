const axios = require("axios");

async function getEmbedding(text) {
  const url = process.env.ML_SERVICE_URL;
  if (!url) throw new Error("ML_SERVICE_URL not set");
  try {
    const response = await axios.post(
      `${url.replace(/\/$/, "")}/embed`,
      { text },
      { timeout: 20000 },
    );
    if (!response.data || !Array.isArray(response.data.vector)) {
      throw new Error("Invalid embedding response");
    }
    return response.data.vector;
  } catch (err) {
    throw new Error("Embedding generation failed");
  }
}

module.exports = { getEmbedding };
