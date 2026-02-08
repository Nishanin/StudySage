const express = require("express");
const upload = require("../middlewares/uploadFiles");
const resourceFileController = require("../controllers/resourceFileController");

const router = express.Router();

router.post(
  "/:resourceId/upload",
  upload.single("file"),
  resourceFileController.uploadResourceFile,
);
router.get("/:resourceId", resourceFileController.getResourceFile);

module.exports = router;
