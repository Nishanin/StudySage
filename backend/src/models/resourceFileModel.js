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

  async getFileByResourceId(resourceId) {
    const { data, error } = await supabase
      .from("resource_files")
      .select("*")
      .eq("resource_id", resourceId);

    return { data, error };
  }

  async getByResourceId(resourceId) {
    const { data, error } = await supabase
      .from("resource_files")
      .select("*")
      .eq("resource_id", resourceId)
      .single();

    return { data, error };
  }
}

module.exports = ResourceFileModel;
