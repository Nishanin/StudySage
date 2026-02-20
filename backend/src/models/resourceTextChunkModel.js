const supabase = require("../supabase");

class ResourceTextChunkModel {
  async insertChunk(payload) {
    const { data, error } = await supabase
      .from("resource_text_chunks")
      .insert([payload])
      .select("id")
      .single();

    return { data, error };
  }

  async getChunksByResourceId(resourceId) {
    const { data, error } = await supabase
      .from("resource_text_chunks")
      .select("*")
      .eq("resource_id", resourceId)
      .order("chunk_index", { ascending: true });

    return { data, error };
  }
}

module.exports = ResourceTextChunkModel;
