const supabase = require("../supabase");

class MessageModel {
  async createMessage({ resource_id, role, content }) {
    if (!resource_id) throw new Error("resource_id required");

    if (!["user", "assistant"].includes(role)) throw new Error("invalid role");

    if (!content || !content.trim()) throw new Error("empty message");

    const { data, error } = await supabase
      .from("chat_messages")
      .insert([{ resource_id, role, content }])
      .select("role, content, created_at")
      .single();

    if (error) throw new Error(error.message || "Failed to insert message");

    return data;
  }

  async getRecentMessages(resource_id, limit = 4) {
    if (!resource_id) throw new Error("resource_id required");

    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("resource_id", resource_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message || "Failed to fetch messages");

    return data || [];
  }
}

module.exports = MessageModel;
