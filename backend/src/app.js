const express = require("express");
const morgan = require("morgan");

// Import routes
const routes = require("./routes");

// Create Express app
const app = express();

// Parse JSON payloads (limit: 10mb for file metadata)
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP request logger (Morgan)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Mount all routes
app.use("/api", routes);

// Health check endpoint (no /api prefix)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "AI Study Companion API",
    version: "1.0.0",
    status: "running",
    health: "/health",
  });
});

module.exports = app;
