const ResourceModel = require("../models/resourceModel");
const ResourceFileModel = require("../models/resourceFileModel");

const resourceModel = new ResourceModel();
const resourceFileModel = new ResourceFileModel();

async function createResource(req, res) {
  const { workspace_id, title, type } = req.body;

  if (!workspace_id || !title || !type) {
    return res.status(400).json({
      success: false,
      error: { message: "workspace_id, title, and type are required" },
    });
  }

  const { data, error } = await resourceModel.create({
    workspace_id,
    title,
    type,
  });

  if (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }

  return res.status(201).json({
    success: true,
    resourceId: data.id,
  });
}

async function getResourcesByWorkspace(req, res) {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({
      success: false,
      error: { message: "workspaceId is required" },
    });
  }

  const { data, error } = await resourceModel.getByWorkspace(workspaceId);

  if (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }

  return res.status(200).json({
    success: true,
    data: data,
  });
}

async function getResourceById(req, res) {
  const { resourceId } = req.params;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      error: { message: "resourceId is required" },
    });
  }

  const { data, error } = await resourceModel.getById(resourceId);

  if (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      error: { message: "Resource not found" },
    });
  }

  return res.status(200).json({
    success: true,
    data: data,
  });
}

module.exports = {
  createResource,
  getResourcesByWorkspace,
  getResourceById,
};
