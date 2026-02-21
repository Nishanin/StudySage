const faqService = require("../services/faqService");
const FAQModel = require("../models/FAQModel");

const faqModel = new FAQModel();

async function generateFAQs(req, res) {
  try {
    const { resource_id } = req.body;
    if (!resource_id || typeof resource_id !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "resource_id is required" });
    }

    let faqs = await faqModel.getByResourceId(resource_id);
    if (faqs && faqs.length > 0) {
      return res.json({
        success: true,
        faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
      });
    }

    faqs = await faqService.generateFAQs(resource_id);
    return res.json({ success: true, faqs });
  } catch (err) {
    console.error("FAQ generation error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Internal server error" });
  }
}

async function getFAQs(req, res) {
  try {
    const resource_id = req.params.resource_id;
    if (!resource_id || typeof resource_id !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "resource_id is required" });
    }
    const faqModel = new FAQModel();
    const faqs = await faqModel.getByResourceId(resource_id);
    return res.json({
      success: true,
      faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
    });
  } catch (err) {
    console.error("FAQ fetch error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Internal server error" });
  }
}

module.exports = {
  generateFAQs,
  getFAQs,
};
