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

async function checkExistingFlashcards(resourceId) {
	const { data, error } = await supabase
		.from("learning_requests")
		.select("*")
		.eq("resource_id", resourceId)
		.eq("request_type", "flashcards")
		.eq("status", "completed")
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to check existing flashcards: ${error.message}`);
	}

	return data || null;
}

function validateFlashcardsOutput(payload) {
	if (!payload || typeof payload !== "object") {
		throw new Error("Invalid ML response: expected object");
	}

	const flashcards = payload.flashcards;
	if (!Array.isArray(flashcards)) {
		throw new Error("Invalid ML response: missing flashcards array");
	}

	if (flashcards.length !== 5) {
		throw new Error("Invalid ML response: flashcards must be length 5");
	}

	for (const card of flashcards) {
		if (!card || typeof card !== "object") {
			throw new Error("Invalid ML response: flashcard must be object");
		}
		const id = String(card.id || "").trim();
		const front = String(card.front || "").trim();
		const back = String(card.back || "").trim();
		if (!id || !front || !back) {
			throw new Error("Invalid ML response: flashcard fields must be non-empty");
		}
	}

	return payload;
}

async function callMLService(text) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
	const startTime = Date.now();

	try {
		const response = await fetch(`${ML_SERVICE_URL}/generate/flashcards`, {
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
				"Flashcards generation failed";
			throw new Error(message);
		}

		console.log(
			`[flashcardsService] ML service call completed in ${duration}ms for text length ${text.length}`
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

async function generateFlashcards(resourceId) {
	if (!resourceId) {
		throw new Error("resourceId is required");
	}

	console.log(`[flashcardsService] Starting flashcards generation for resource ${resourceId}`);
	let requestRecord = null;

	try {
		await validateResourceExists(resourceId);
		console.log(`[flashcardsService] Resource validated: ${resourceId}`);

		const existingFlashcards = await checkExistingFlashcards(resourceId);
		if (existingFlashcards) {
			console.log(
				`[flashcardsService] Using cached flashcards for resource ${resourceId} (id: ${existingFlashcards.id})`
			);
			const cachedFlashcards =
				existingFlashcards.generated_content &&
				Array.isArray(existingFlashcards.generated_content.flashcards)
					? existingFlashcards.generated_content.flashcards
					: [];
			return {
				request: existingFlashcards,
				flashcards: cachedFlashcards,
			};
		}

		const chunks = await fetchChunks(resourceId);
		const chunkCount = chunks.length;
		console.log(
			`[flashcardsService] Fetched ${chunkCount} chunks for resource ${resourceId}`
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
				`[flashcardsService] Text truncated to ${MAX_TEXT_LENGTH} characters`
			);
		}

		const payload = await callMLService(text);
		validateFlashcardsOutput(payload);

		const { data, error } = await learningRequestModel.insert(
			resourceId,
			"flashcards",
			"completed",
			payload
		);

		if (error) {
			throw new Error(error.message || "Failed to persist flashcards");
		}

		requestRecord = data || null;
		console.log(
			`[flashcardsService] Flashcards successfully generated and stored for resource ${resourceId}`
		);

		return {
			request: requestRecord,
			flashcards: payload.flashcards,
		};
	} catch (err) {
		console.error(
			`[flashcardsService] Error generating flashcards for resource ${resourceId}: ${err.message}`
		);

		if (!requestRecord) {
			await learningRequestModel.insert(resourceId, "flashcards", "failed", {
				error: err.message || "Flashcards generation failed",
			});
		}
		throw err;
	}
}

module.exports = {
	generateFlashcards,
};
