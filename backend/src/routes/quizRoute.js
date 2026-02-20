const express = require("express");
const auth = require("../middlewares/auth");
const quizController = require("../controllers/quizController");

const router = express.Router();

router.post("/:resourceId/generate", auth, quizController.generateQuiz);
router.get("/:resourceId", auth, quizController.getQuiz);

module.exports = router;
