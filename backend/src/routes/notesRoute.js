const express = require("express");
const auth = require("../middlewares/auth");
const notesController = require("../controllers/notesController");

const router = express.Router();

router.post("/:resourceId/generate", auth, notesController.generateNotes);
router.get("/:id/markdown", auth, notesController.getNotesMarkdown);
router.get("/:resourceId", auth, notesController.getNotes);

module.exports = router;
