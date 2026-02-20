const axios = require("axios");

async function getEmbedding(text) {
  const url = process.env.ML_SERVICE_URL;
  if (!url) throw new Error("ML_SERVICE_URL not set");
  try {
    const response = await axios.post(
      `${url}/embed`,
      { text },
      { timeout: 20000 },
    );
    if (!response.data || !Array.isArray(response.data.vector)) {
      throw new Error("Invalid embedding response");
    }
    return response.data.vector;
  } catch (err) {
    console.warn(
      "[Embedding] ML service unavailable — skipping vector indexing",
    );
    return null;
  }
}

module.exports = { getEmbedding };
