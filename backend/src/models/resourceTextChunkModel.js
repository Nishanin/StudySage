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
}

module.exports = ResourceTextChunkModel;
