const flashcardsService = require("../services/flashcardsService");
const LearningRequestModel = require("../models/learningRequestModel");
const ResourceModel = require("../models/resourceModel");
const supabase = require("../supabase");

const learningRequestModel = new LearningRequestModel();
const resourceModel = new ResourceModel();

async function validateResourceOwnership(resourceId, userId) {
	const { data: resource, error: resourceError } = await resourceModel.getById(resourceId);

	if (resourceError) {
		throw new Error("Failed to validate resource access");
	}

	if (!resource) {
		const err = new Error("Resource not found");
		err.statusCode = 404;
		throw err;
	}

	const { data: workspace, error: workspaceError } = await supabase
		.from("study_workspaces")
		.select("user_id")
		.eq("id", resource.workspace_id)
		.maybeSingle();

	if (workspaceError || !workspace || workspace.user_id !== userId) {
		const err = new Error("Access denied");
		err.statusCode = 403;
		throw err;
	}

	return resource;
}

async function generateFlashcards(req, res) {
	try {
		const { resourceId } = req.params;
		const userId = req.user.id;

		if (!resourceId) {
			return res.status(400).json({
				success: false,
				error: { message: "resourceId is required" },
			});
		}

		await validateResourceOwnership(resourceId, userId);

		const data = await flashcardsService.generateFlashcards(resourceId);

		return res.status(200).json({
			success: true,
			status: "completed",
			flashcards: data.flashcards,
		});
	} catch (err) {
		const statusCode = err.statusCode || 500;
		return res.status(statusCode).json({
			success: false,
			error: { message: err.message || "Flashcards generation failed" },
		});
	}
}

async function getFlashcards(req, res) {
	try {
		const { resourceId } = req.params;
		const userId = req.user.id;

		if (!resourceId) {
			return res.status(400).json({
				success: false,
				error: { message: "resourceId is required" },
			});
		}

		await validateResourceOwnership(resourceId, userId);

		const { data, error } = await learningRequestModel.getByResourceId(
			resourceId,
		);

		if (error) {
			return res.status(500).json({
				success: false,
				error: { message: error.message || "Failed to fetch flashcards" },
			});
		}

		const flashcardRequests = (data || []).filter(
			(item) => item.request_type === "flashcards" && item.status === "completed"
		);

		const latest = flashcardRequests[0] || null;
		const stored = latest && latest.generated_content ? latest.generated_content : {};
		const flashcards = Array.isArray(stored.flashcards) ? stored.flashcards : [];

		return res.status(200).json({
			flashcards,
		});
	} catch (err) {
		const statusCode = err.statusCode || 500;
		return res.status(statusCode).json({
			success: false,
			error: { message: err.message || "Failed to fetch flashcards" },
		});
	}
}

module.exports = {
	generateFlashcards,
	getFlashcards,
};
