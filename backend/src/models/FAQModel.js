const supabase = require("../supabase");

class FAQModel {
  async createMany(resource_id, faqArray) {
    if (!resource_id) throw new Error("resource_id required");
    if (!Array.isArray(faqArray) || faqArray.length === 0)
      throw new Error("faqArray must be a non-empty array");
    const rows = faqArray.map((faq) => ({
      resource_id,
      question: faq.question,
      answer: faq.answer,
    }));
    const { data, error } = await supabase
      .from("study_faqs")
      .insert(rows)
      .select();
    if (error) throw new Error(error.message || "Failed to insert FAQs");
    return { data, error };
  }

  async getByResourceId(resource_id) {
    if (!resource_id) throw new Error("resource_id required");
    const { data, error } = await supabase
      .from("study_faqs")
      .select("id, question, answer, created_at")
      .eq("resource_id", resource_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message || "Failed to fetch FAQs");
    return data || [];
  }

  async deleteByResourceId(resource_id) {
    if (!resource_id) throw new Error("resource_id required");
    const { data, error } = await supabase
      .from("study_faqs")
      .delete()
      .eq("resource_id", resource_id);
    if (error) throw new Error(error.message || "Failed to delete FAQs");
    return { data, error };
  }
}

module.exports = FAQModel;
