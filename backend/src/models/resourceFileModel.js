const supabase = require("../supabase");

class ResourceFileModel {
  async create(payload) {
    const { data, error } = await supabase
      .from("resource_files")
      .insert([payload])
      .select("*")
      .single();

    return { data, error };
  }
}

module.exports = ResourceFileModel;