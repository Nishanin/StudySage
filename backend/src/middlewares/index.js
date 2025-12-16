/**
 * Middleware Index - Central Export Point
 * Import all middleware from this single file
 * 
 * Usage:
 * const { asyncHandler, validate, errorHandler } = require('./middlewares');
 */

module.exports = {
  asyncHandler: require('./asyncHandler'),
  validate: require('./validate'),
  errorHandler: require('./errorHandler'),
  notFoundHandler: require('./notFoundHandler'),
  requestLogger: require('./requestLogger')
};
