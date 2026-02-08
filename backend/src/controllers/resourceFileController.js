const ResourceModel = require("../models/resourceModel");
const ResourceFileModel = require("../models/resourceFileModel");

const resourceFileModel = new ResourceFileModel();
const resourceModel = new ResourceModel();

async function uploadResourceFile(req, res) {
  const { resourceId } = req.params;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      error: { message: "resourceId is required" },
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: "File is required" },
    });
  }

  const { data: resource, error: resourceError } =
    await resourceModel.getById(resourceId);

  if (resourceError) {
    return res.status(500).json({
      success: false,
      error: { message: resourceError.message },
    });
  }

  if (!resource) {
    return res.status(404).json({
      success: false,
      error: { message: "Resource not found" },
    });
  }

  const filePayload = {
    resource_id: resourceId,
    storage_type: "local",
    local_path: req.file.path,
    original_file_name: req.file.originalname,
    mime_type: req.file.mimetype,
    file_size_bytes: req.file.size,
  };

  const { data, error } = await resourceFileModel.create(filePayload);

  if (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }

  return res.status(201).json({
    success: true,
    data: data,
  });
}

async function getResourceFile(req, res) {
  const { resourceId } = req.params;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      error: { message: "resourceId is required" },
    });
  }

  const { data, error } =
    await resourceFileModel.getFileByResourceId(resourceId);

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

module.exports = {
  uploadResourceFile,
  getResourceFile,
};
