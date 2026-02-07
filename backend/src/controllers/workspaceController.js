const {
  createWorkspace,
  getWorkspacesByUser,
  getWorkspaceById,
} = require("../models/workspaceModel");

async function createWorkspaceHandler(req, res) {
  try {
    const { user_id, title } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({ error: "user_id and title are required" });
    }

    const workspace = await createWorkspace({ user_id, title });
    return res.status(201).json({
      status: "success",
      message: "Workspace created successfully",
      data: { workspace_id: workspace.id },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create workspace" });
  }
}

async function getWorkspacesHandler(req, res) {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const workspaces = await getWorkspacesByUser(user_id);
    return res.status(200).json({
      status: "success",
      data: workspaces,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch workspaces" });
  }
}

async function getWorkspaceByIdHandler(req, res) {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const workspace = await getWorkspaceById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.status(200).json({ status: "success", data: workspace });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch workspace" });
  }
}

module.exports = {
  createWorkspaceHandler,
  getWorkspacesHandler,
  getWorkspaceByIdHandler,
};
