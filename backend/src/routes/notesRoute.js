const express = require("express");
const auth = require("../middlewares/auth");
const notesController = require("../controllers/notesController");

const router = express.Router();

router.post("/:resourceId/generate", auth, notesController.generateNotes);
router.get("/:resourceId", notesController.getNotes);

router.get("/:id/markdown", notesController.getNotesMarkdown);

module.exports = router;
