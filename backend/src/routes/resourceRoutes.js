const express = require("express");
const upload = require("../middlewares/uploadFiles");
const resourceController = require("../controllers/resourceController");

const router = express.Router();

router.post("/", resourceController.createResource);
router.get(
  "/workspaces/:workspaceId/resources",
  resourceController.getResourcesByWorkspace,
);
router.get("/:resourceId", resourceController.getResourceById);
router.delete("/:resourceId", resourceController.deleteResourceById);

module.exports = router;
