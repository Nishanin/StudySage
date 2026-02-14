const express = require("express");
const auth = require("../middlewares/auth");
const flashcardsController = require("../controllers/flashcardsController");

const router = express.Router();

router.post("/:resourceId/generate", auth, flashcardsController.generateFlashcards);
router.get("/:resourceId", auth, flashcardsController.getFlashcards);

module.exports = router;
