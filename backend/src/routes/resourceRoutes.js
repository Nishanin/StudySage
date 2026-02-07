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

router.post(
  "/:resourceId/upload",
  upload.single("file"),
  resourceController.uploadResourceFile,
);

module.exports = router;
