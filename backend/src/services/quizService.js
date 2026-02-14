const supabase = require("../supabase");
const ResourceModel = require("../models/resourceModel");
const LearningRequestModel = require("../models/learningRequestModel");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const MAX_TEXT_LENGTH = 8000;
const MAX_CHUNKS = 500;
const ML_TIMEOUT_MS = 20000;

const learningRequestModel = new LearningRequestModel();
const resourceModel = new ResourceModel();

async function fetchChunks(resourceId) {
	const { data, error } = await supabase
		.from("resource_text_chunks")
		.select("content, page_number, slide_number, source_type, chunk_index")
		.eq("resource_id", resourceId)
		.order("page_number", { ascending: true })
		.order("slide_number", { ascending: true })
		.order("chunk_index", { ascending: true });

	if (error) {
		throw new Error(error.message || "Failed to fetch text chunks");
	}

	return data || [];
}

function mergeChunksPageWise(chunks) {
	const merged = new Map();

	for (const chunk of chunks) {
		const isPptx = chunk.source_type === "pptx";
		const pageNumber = isPptx ? chunk.slide_number : chunk.page_number;
		const key = pageNumber != null ? `${isPptx ? "s" : "p"}-${pageNumber}` : "p-0";

		if (!merged.has(key)) {
			merged.set(key, {
				index: pageNumber != null ? Number(pageNumber) : 0,
				type: isPptx ? "slide" : "page",
				page_number: isPptx ? null : pageNumber,
				slide_number: isPptx ? pageNumber : null,
				text: "",
			});
		}

		const entry = merged.get(key);
		const text = chunk.content ? String(chunk.content).trim() : "";
		if (!text) continue;
		entry.text = entry.text ? `${entry.text}\n${text}` : text;
	}

	const pages = Array.from(merged.values()).sort((a, b) => a.index - b.index);
	const combinedText = pages.map((page) => page.text).filter(Boolean).join("\n\n");

	return { pages, text: combinedText };
}

async function validateResourceExists(resourceId) {
	const { data, error } = await resourceModel.getById(resourceId);
	if (error) {
		throw new Error(`Failed to validate resource: ${error.message}`);
	}
	if (!data) {
		const err = new Error(`Resource ${resourceId} not found`);
		err.statusCode = 404;
		throw err;
	}
	return data;
}

async function checkExistingQuiz(resourceId) {
	const { data, error } = await supabase
		.from("learning_requests")
		.select("*")
		.eq("resource_id", resourceId)
		.eq("request_type", "quiz")
		.eq("status", "completed")
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to check existing quiz: ${error.message}`);
	}

	return data || null;
}

function validateQuizOutput(payload) {
	if (!payload || typeof payload !== "object") {
		throw new Error("Invalid ML response: expected object");
	}

	const quiz = payload.quiz;
	if (!Array.isArray(quiz)) {
		throw new Error("Invalid ML response: missing quiz array");
	}

	if (quiz.length !== 10) {
		throw new Error("Invalid ML response: quiz must be length 10");
	}

	for (const item of quiz) {
		if (!item || typeof item !== "object") {
			throw new Error("Invalid ML response: quiz item must be object");
		}
		const id = item.id;
		const question = String(item.question || "").trim();
		const options = item.options;
		const answer = String(item.answer || "").trim();

		if (id == null || !question || !answer) {
			throw new Error("Invalid ML response: quiz item fields must be non-empty");
		}
		if (!Array.isArray(options) || options.length !== 4) {
			throw new Error("Invalid ML response: options must be array of 4");
		}
		if (options.some((opt) => !String(opt || "").trim())) {
			throw new Error("Invalid ML response: options cannot be empty");
		}
		if (!options.map((o) => String(o).trim()).includes(answer)) {
			throw new Error("Invalid ML response: answer must match one option");
		}
	}

	return payload;
}

async function callMLService(text) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
	const startTime = Date.now();

	try {
		console.log("[quizService] Calling ML quiz service");
		const response = await fetch(`${ML_SERVICE_URL}/generate/quiz`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text }),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		const duration = Date.now() - startTime;

		const payload = await response.json().catch(() => ({}));

		if (!response.ok) {
			const message =
				payload?.detail ||
				payload?.error?.message ||
				payload?.message ||
				"Quiz generation failed";
			throw new Error(message);
		}

		console.log(
			`[quizService] ML service call completed in ${duration}ms for text length ${text.length}`
		);
		return payload;
	} catch (err) {
		clearTimeout(timeoutId);
		if (err.name === "AbortError") {
			throw new Error(`ML service request timeout after ${ML_TIMEOUT_MS / 1000}s`);
		}
		throw err;
	}
}

async function generateQuiz(resourceId) {
	if (!resourceId) {
		throw new Error("resourceId is required");
	}

	console.log(`[quizService] Generating quiz for resourceId ${resourceId}`);
	let requestRecord = null;

	try {
		await validateResourceExists(resourceId);
		console.log(`[quizService] Resource validated: ${resourceId}`);

		const existingQuiz = await checkExistingQuiz(resourceId);
		if (existingQuiz) {
			console.log(
				`[quizService] Using cached quiz for resource ${resourceId} (id: ${existingQuiz.id})`
			);
			const cachedQuiz =
				existingQuiz.generated_content &&
				Array.isArray(existingQuiz.generated_content.quiz)
					? existingQuiz.generated_content.quiz
					: [];
			return {
				request: existingQuiz,
				quiz: cachedQuiz,
			};
		}

		const chunks = await fetchChunks(resourceId);
		const chunkCount = chunks.length;
		console.log(
			`[quizService] Chunks found: ${chunkCount} for resource ${resourceId}`
		);

		if (!chunks.length) {
			const err = new Error("No extracted text available for this resource");
			err.statusCode = 400;
			throw err;
		}

		if (chunks.length > MAX_CHUNKS) {
			const err = new Error(
				`Resource has too many chunks (${chunks.length}). Maximum allowed: ${MAX_CHUNKS}`
			);
			err.statusCode = 400;
			throw err;
		}

		const merged = mergeChunksPageWise(chunks);
		let text = merged.text ? merged.text.trim() : "";

		if (!text) {
			const err = new Error("No extracted text available for this resource");
			err.statusCode = 400;
			throw err;
		}

		if (text.length > MAX_TEXT_LENGTH) {
			text = text.slice(0, MAX_TEXT_LENGTH);
			console.log(
				`[quizService] Text truncated to ${MAX_TEXT_LENGTH} characters`
			);
		}

		const payload = await callMLService(text);
		validateQuizOutput(payload);

		const { data, error } = await learningRequestModel.insert(
			resourceId,
			"quiz",
			"completed",
			payload
		);

		if (error) {
			throw new Error(error.message || "Failed to persist quiz");
		}

		requestRecord = data || null;
		console.log(
			`[quizService] Quiz saved successfully for resource ${resourceId}`
		);

		return {
			request: requestRecord,
			quiz: payload.quiz,
		};
	} catch (err) {
		console.error(
			`[quizService] Error generating quiz for resource ${resourceId}: ${err.message}`
		);

		if (!requestRecord) {
			await learningRequestModel.insert(resourceId, "quiz", "failed", {
				error: err.message || "Quiz generation failed",
			});
		}
		throw err;
	}
}

module.exports = {
	generateQuiz,
};
