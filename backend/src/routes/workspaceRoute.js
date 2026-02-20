const express = require("express");
const {
  createWorkspaceHandler,
  getWorkspacesHandler,
  getWorkspaceByIdHandler,
  deleteWorkspaceByIdHandler,
} = require("../controllers/workspaceController");

const router = express.Router();

router.post("/", createWorkspaceHandler);
router.get("/", getWorkspacesHandler);
router.get("/:workspaceId", getWorkspaceByIdHandler);
router.delete("/:workspaceId", deleteWorkspaceByIdHandler);

module.exports = router;
