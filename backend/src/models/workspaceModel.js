const supabase = require("../supabase");

async function createWorkspace({ user_id, title }) {
  const { data, error } = await supabase
    .from("study_workspaces")
    .insert({ user_id: user_id, title: title })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getWorkspacesByUser(user_id) {
  const { data, error } = await supabase
    .from("study_workspaces")
    .select("id, user_id, title, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

async function getWorkspaceById(workspace_id) {
  const { data, error } = await supabase
    .from("study_workspaces")
    .select("id, user_id, title, created_at")
    .eq("id", workspace_id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function deleteWorkspaceById(workspace_id) {
  const { data, error } = await supabase
    .from("study_workspaces")
    .delete()
    .eq("id", workspace_id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  createWorkspace,
  getWorkspacesByUser,
  getWorkspaceById,
  deleteWorkspaceById,
};
