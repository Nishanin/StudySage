const express = require("express");
const auth = require("../middlewares/auth");
const mindmapController = require("../controllers/mindmapController");

const router = express.Router();

router.post("/:resourceId/generate", auth, mindmapController.generateMindmap);
router.get("/:resourceId", auth, mindmapController.getMindmap);

module.exports = router;
