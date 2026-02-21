// Middleware to log and optionally return the duration of a request
module.exports = function timingMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  console.log(start);

  // Attach a function to res to get duration in ms
  res.getDurationMs = () => {
    const end = process.hrtime.bigint();
    console.log(end);
    return Number(end - start) / 1e6;
  };

  // Log duration when response finishes
  res.on("finish", () => {
    const durationMs = res.getDurationMs();
    console.log(
      `[Timing] ${req.method} ${req.originalUrl} took ${durationMs.toFixed(2)} ms`,
    );
  });

  next();
};
