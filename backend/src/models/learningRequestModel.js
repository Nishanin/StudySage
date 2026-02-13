const supabase = require("../supabase");

class LearningRequestModel {
  async insert(resourceId, type, status, content) {
    const { data, error } = await supabase
      .from("learning_requests")
      .insert({
        resource_id: resourceId,
        request_type: type,
        status,
        generated_content: content,
      })
      .select("*")
      .single();

    return { data, error };
  }

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from("learning_requests")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    return { data, error };
  }

  async getByResourceId(resourceId) {
    const { data, error } = await supabase
      .from("learning_requests")
      .select("*")
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: false });

    return { data, error };
  }
}

module.exports = LearningRequestModel;
