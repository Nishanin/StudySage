const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./routes/authRoutes");
const resourcesRoute = require("./routes/resourceRoutes");
const workspaceRoute = require("./routes/workspaceRoute");
const resourceFileRoute = require("./routes/resourceFileRoute");
const youtubeRoutes = require("./routes/youtubeRoutes");
const notesRoute = require("./routes/notesRoute");
const flashcardsRoute = require("./routes/flashcardsRoute");
const quizRoute = require("./routes/quizRoute");
const liveLectureRoute = require("./live-lecture/routes/liveLectureRoute");

// Mount routes
router.use("/auth", authRoutes);
router.use("/resources", resourcesRoute);
router.use("/workspace", workspaceRoute);
router.use("/files", resourceFileRoute);
router.use("/youtube", youtubeRoutes);
router.use("/notes", notesRoute);
router.use("/flashcards", flashcardsRoute);
router.use("/quiz", quizRoute);
router.use("/live-lecture", liveLectureRoute);

// API status endpoint
router.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is operational",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined API routes
router.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      statusCode: 404,
    },
  });
});

module.exports = router;
