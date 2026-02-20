const supabase = require("../supabase");
const ResourceModel = require("../models/resourceModel");
const LearningRequestModel = require("../models/learningRequestModel");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const MAX_TEXT_LENGTH = 8000;
const MAX_CHUNKS = 500;
const ML_TIMEOUT_MS = 30000;

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
    throw new Error(`Resource ${resourceId} not found`);
  }
  return data;
}

async function checkExistingNotes(resourceId) {
  const { data, error } = await supabase
    .from("learning_requests")
    .select("*")
    .eq("resource_id", resourceId)
    .eq("request_type", "notes")
    .eq("status", "completed")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check existing notes: ${error.message}`);
  }

  return data || null;
}

function validateNotesOutput(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid ML response: expected object");
  }
  if (!payload.notes) {
    throw new Error("Invalid ML response: missing notes field");
  }
  return payload;
}

async function callMLService(text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    const response = await fetch(`${ML_SERVICE_URL}/generate/notes`, {
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
        "Notes generation failed";
      throw new Error(message);
    }

    console.log(
      `[notesService] ML service call completed in ${duration}ms for text length ${text.length}`
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

async function generateNotes(resourceId) {
  if (!resourceId) {
    throw new Error("resourceId is required");
  }

  console.log(`[notesService] Starting notes generation for resource ${resourceId}`);
  let requestRecord = null;

  try {
    // Validate resource exists
    await validateResourceExists(resourceId);
    console.log(`[notesService] Resource validated: ${resourceId}`);

    // Check for existing completed notes (duplicate prevention)
    const existingNotes = await checkExistingNotes(resourceId);
    if (existingNotes) {
      console.log(
        `[notesService] Using cached notes for resource ${resourceId} (id: ${existingNotes.id})`
      );
      return {
        request: existingNotes,
        notes: existingNotes.generated_content.output,
        pages: existingNotes.generated_content.pages || [],
      };
    }

    // Fetch chunks
    const chunks = await fetchChunks(resourceId);
    const chunkCount = chunks.length;
    console.log(
      `[notesService] Fetched ${chunkCount} chunks for resource ${resourceId}`
    );

    if (!chunks.length) {
      throw new Error("No extracted text available for this resource");
    }

    // Validate chunk count to prevent memory issues
    if (chunks.length > MAX_CHUNKS) {
      throw new Error(
        `Resource has too many chunks (${chunks.length}). Maximum allowed: ${MAX_CHUNKS}`
      );
    }

    // Merge chunks
    const merged = mergeChunksPageWise(chunks);
    let text = merged.text ? merged.text.trim() : "";

    if (!text) {
      throw new Error("No extracted text available for this resource");
    }

    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH);
      console.log(
        `[notesService] Text truncated to ${MAX_TEXT_LENGTH} characters`
      );
    }

    // Call ML service with timeout
    const payload = await callMLService(text);
    validateNotesOutput(payload);

    // Store result with pages array for future cache lookups
    const { data, error } = await learningRequestModel.insert(
      resourceId,
      "notes",
      "completed",
      {
        input: { textLength: text.length, pageCount: merged.pages.length },
        output: payload,
        pages: merged.pages,
      },
    );

    if (error) {
      throw new Error(error.message || "Failed to persist notes");
    }

    requestRecord = data || null;
    console.log(
      `[notesService] Notes successfully generated and stored for resource ${resourceId}`
    );

    return {
      request: requestRecord,
      notes: payload,
      pages: merged.pages,
    };
  } catch (err) {
    console.error(
      `[notesService] Error generating notes for resource ${resourceId}: ${err.message}`
    );

    if (!requestRecord) {
      await learningRequestModel.insert(resourceId, "notes", "failed", {
        error: err.message || "Notes generation failed",
      });
    }
    throw err;
  }
}

module.exports = {
  generateNotes,
};
