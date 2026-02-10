const supabase = require("../supabase");

class ResourceModel {
  async create(payload) {
    const { data, error } = await supabase
      .from("study_resources")
      .insert([payload])
      .select("id")
      .single();

    return { data, error };
  }

  async getByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from("study_resources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  async getById(resourceId) {
    const { data, error } = await supabase
      .from("study_resources")
      .select("*")
      .eq("id", resourceId)
      .maybeSingle();

    return { data, error };
  }

  async deleteById(resourceId) {
    const { data, error } = await supabase
      .from("study_resources")
      .delete()
      .eq("id", resourceId)
      .select("id")
      .single();

    return { data, error };
  }
}

module.exports = ResourceModel;
