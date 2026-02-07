const express = require("express");
const {
  createWorkspaceHandler,
  getWorkspacesHandler,
  getWorkspaceByIdHandler,
} = require("../controllers/workspaceController");

const router = express.Router();

router.post("/", createWorkspaceHandler);
router.get("/", getWorkspacesHandler);
router.get("/:workspaceId", getWorkspaceByIdHandler);

module.exports = router;
