const ResourceTextChunkModel = require("../models/resourceTextChunkModel");
const FAQModel = require("../models/FAQModel");
const axios = require("axios");

const faqModel = new FAQModel();
const chunkModel = new ResourceTextChunkModel();

async function generateFAQs(resourceId, force = false) {
  if (!resourceId) throw new Error("resourceId required");

  // Check for existing FAQs
  let existingFaqs = await faqModel.getByResourceId(resourceId);
  if (!force && existingFaqs && existingFaqs.length > 0) {
    return existingFaqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }));
  }

  const { data: chunks, error: chunkError } =
    await chunkModel.getChunksByResourceId(resourceId);
  if (chunkError)
    throw new Error(chunkError.message || "Failed to fetch chunks");
  if (!chunks || chunks.length === 0)
    throw new Error("No chunks found for resource");

  // Select top 8 chunks by highest token_count
  const selectedChunks = [...chunks]
    .filter((chunk) => typeof chunk.token_count === "number")
    .sort((a, b) => b.token_count - a.token_count)
    .slice(0, 8);
  // Fallback: if not enough chunks with token_count, fill from remaining
  if (selectedChunks.length < 8) {
    const missing = 8 - selectedChunks.length;
    const usedIds = new Set(selectedChunks.map((c) => c.id));
    const additional = chunks
      .filter((c) => !usedIds.has(c.id))
      .slice(0, missing);
    selectedChunks.push(...additional);
  }
  const combinedText = selectedChunks.map((c) => c.content).join("\n\n");

  let faqs;
  try {
    const response = await axios.post(
      process.env.ML_SERVICE_URL + "/generate/faqs",
      {
        context_text: combinedText,
        count: 8,
      },
      { timeout: 120000 },
    );
    faqs =
      response.data && Array.isArray(response.data.faqs)
        ? response.data.faqs
        : response.data;
    if (!Array.isArray(faqs))
      throw new Error("Invalid FAQ response from ML service");
  } catch (err) {
    let errorMsg = err.message;
    if (err.response && err.response.data) {
      if (typeof err.response.data === "object") {
        errorMsg = JSON.stringify(err.response.data);
      } else {
        errorMsg = err.response.data.error || err.message;
      }
    }
    throw new Error("ML service error: " + errorMsg);
  }

  await faqModel.deleteByResourceId(resourceId);
  await faqModel.createMany(resourceId, faqs);

  return faqs.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  }));
}

async function getFAQs(resourceId) {
  if (!resourceId) throw new Error("resourceId required");
  const faqs = await faqModel.getByResourceId(resourceId);
  return faqs.map((faq) => ({ question: faq.question, answer: faq.answer }));
}

module.exports = {
  generateFAQs,
  getFAQs,
};
