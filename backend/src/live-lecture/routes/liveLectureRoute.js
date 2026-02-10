const express = require("express");
const liveLectureController = require("../controllers/liveLectureController");
const auth = require("../../middlewares/auth");

const router = express.Router();

router.post("/start", auth, liveLectureController.startLiveLecture);
router.post("/end", auth, liveLectureController.endLiveLecture);
router.get(
  "/:lectureId/chunks",
  auth,
  liveLectureController.getLiveLectureChunks,
);

module.exports = router;
