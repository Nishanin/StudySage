const {
  liveLectureService,
} = require("../services/liveLectureServiceInstance");

const resolveLectureId = (body) => body?.lectureId || body?.lecture_id;
const resolveResourceId = (body) => body?.resourceId || body?.resource_id;

async function startLiveLecture(req, res) {
  try {
    const lectureId = resolveLectureId(req.body);
    if (!lectureId) {
      return res.status(400).json({
        success: false,
        error: { message: "lectureId is required" },
      });
    }

    const resourceId = resolveResourceId(req.body);
    liveLectureService.startLecture(lectureId, { resourceId });

    return res.status(201).json({
      success: true,
      data: {
        lectureId,
        resourceId: resourceId || lectureId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message || "Failed to start live lecture" },
    });
  }
}

async function endLiveLecture(req, res) {
  try {
    const lectureId = resolveLectureId(req.body);
    if (!lectureId) {
      return res.status(400).json({
        success: false,
        error: { message: "lectureId is required" },
      });
    }

    const ending = liveLectureService.requestEndLecture(
      lectureId,
      "manual-end",
    );
    if (!ending) {
      return res.status(200).json({
        success: true,
        data: { lectureId, status: "already-ended" },
      });
    }

    return res.status(200).json({
      success: true,
      data: { lectureId, status: "ending" },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message || "Failed to end live lecture" },
    });
  }
}

async function getLiveLectureChunks(req, res) {
  try {
    const { lectureId } = req.params;
    if (!lectureId) {
      return res.status(400).json({
        success: false,
        error: { message: "lectureId is required" },
      });
    }

    const chunks = await liveLectureService.getLectureChunks(lectureId);
    return res.status(200).json({
      success: true,
      data: chunks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error.message || "Failed to fetch chunks" },
    });
  }
}

module.exports = {
  startLiveLecture,
  endLiveLecture,
  getLiveLectureChunks,
};
