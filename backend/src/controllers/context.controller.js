const asyncHandler = require('../middlewares/asyncHandler');
const ContextService = require('../services/context.service');

const updateContext = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { resourceId, pageNumber, timestampSeconds, metadata } = req.body;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'resourceId is required',
        statusCode: 400
      }
    });
  }

  // Update context (stored in memory + async DB persistence)
  const context = await ContextService.updateContext(userId, resourceId, {
    pageNumber,
    timestampSeconds,
    metadata
  });

  res.status(200).json({
    success: true,
    data: {
      context: {
        resourceId: context.resourceId,
        pageNumber: context.pageNumber,
        timestampSeconds: context.timestampSeconds,
        metadata: context.metadata,
        lastActivityAt: context.lastActivityAt,
        updatedAt: context.updatedAt
      }
    }
  });
});

const getCurrentContext = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const context = await ContextService.getCurrentContext(userId);

  res.status(200).json({
    success: true,
    data: {
      context: context ? {
        resourceId: context.resourceId,
        pageNumber: context.pageNumber,
        timestampSeconds: context.timestampSeconds,
        metadata: context.metadata,
        lastActivityAt: context.lastActivityAt,
        updatedAt: context.updatedAt
      } : null
    }
  });
});

const clearContext = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await ContextService.clearContext(userId);

  res.status(200).json({
    success: true,
    data: {
      message: 'Context cleared'
    }
  });
});

const getContextAge = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const age = ContextService.getContextAge(userId);

  res.status(200).json({
    success: true,
    data: {
      ageMilliseconds: age,
      isActive: age !== null
    }
  });
});

module.exports = {
  updateContext,
  getCurrentContext,
  clearContext,
  getContextAge
};
