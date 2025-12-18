/**
 * 404 Not Found Handler Middleware
 * Catches all undefined routes
 */

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      statusCode: 404,
      path: req.originalUrl
    }
  });
};

module.exports = notFoundHandler;
