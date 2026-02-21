const express = require("express");
const router = express.Router();

// Import individual route files
const authRoutes = require("./authRoutes");
const chatRoutes = require("./chatRoutes");
const exportRoute = require("./exportRoute");
const faqRoute = require("./faqRoute");
const flashcardsRoute = require("./flashcardsRoute");
const mindmapRoute = require("./mindmapRoute");
const notesRoute = require("./notesRoute");
const quizRoute = require("./quizRoute");
const resourceFileRoute = require("./resourceFileRoute");
const resourceRoutes = require("./resourceRoutes");
const workspaceRoute = require("./workspaceRoute");
const youtubeRoutes = require("./youtubeRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/export", exportRoute);
router.use("/faqs", faqRoute);
router.use("/flashcards", flashcardsRoute);
router.use("/mindmap", mindmapRoute);
router.use("/notes", notesRoute);
router.use("/quiz", quizRoute);
router.use("/resource-file", resourceFileRoute);
router.use("/resources", resourceRoutes);
router.use("/workspace", workspaceRoute);
router.use("/youtube", youtubeRoutes);

module.exports = router;