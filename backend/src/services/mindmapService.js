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

async function checkExistingMindmap(resourceId) {
  const { data, error } = await supabase
    .from("learning_requests")
    .select("*")
    .eq("resource_id", resourceId)
    .eq("request_type", "mindmap")
    .eq("status", "completed")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check existing mindmap: ${error.message}`);
  }

  return data || null;
}

function validateMindmapOutput(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid ML response: expected object");
  }
  if (!payload.mindmap || typeof payload.mindmap !== "object") {
    throw new Error("Invalid ML response: missing mindmap field");
  }

  const mm = payload.mindmap;

  if (typeof mm.root !== "string" || !mm.root.trim()) {
    throw new Error("Invalid ML response: root must be a non-empty string");
  }
  if (!Array.isArray(mm.nodes) || mm.nodes.length < 1) {
    throw new Error("Invalid ML response: nodes must be a non-empty array");
  }

  const nodeIds = new Set(mm.nodes.map((n) => n.id));

  for (const node of mm.nodes) {
    if (!node.id || !node.label || !node.parent) {
      throw new Error(
        `Invalid ML response: node missing required keys (id, label, parent): ${JSON.stringify(node)}`
      );
    }
    if (node.parent !== "root" && !nodeIds.has(node.parent)) {
      throw new Error(
        `Invalid ML response: node "${node.id}" references unknown parent "${node.parent}"`
      );
    }
  }

  return payload;
}

async function callMLService(text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    const response = await fetch(`${ML_SERVICE_URL}/generate/mindmap`, {
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
        "Mindmap generation failed";
      throw new Error(message);
    }

    console.log(
      `[mindmapService] ML service call completed in ${duration}ms for text length ${text.length}`
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

async function generateMindmap(resourceId) {
  if (!resourceId) {
    throw new Error("resourceId is required");
  }

  console.log(`[mindmapService] Starting mindmap generation for resource ${resourceId}`);
  let requestRecord = null;

  try {
    // Validate resource exists
    await validateResourceExists(resourceId);
    console.log(`[mindmapService] Resource validated: ${resourceId}`);

    // Check for existing completed mindmap (duplicate prevention)
    const existingMindmap = await checkExistingMindmap(resourceId);
    if (existingMindmap) {
      console.log(
        `[mindmapService] Using cached mindmap for resource ${resourceId} (id: ${existingMindmap.id})`
      );
      return {
        request: existingMindmap,
        mindmap: existingMindmap.generated_content.output.mindmap,
      };
    }

    // Fetch chunks
    const chunks = await fetchChunks(resourceId);
    const chunkCount = chunks.length;
    console.log(
      `[mindmapService] Fetched ${chunkCount} chunks for resource ${resourceId}`
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
        `[mindmapService] Text truncated to ${MAX_TEXT_LENGTH} characters`
      );
    }

    // Call ML service with timeout
    const payload = await callMLService(text);
    validateMindmapOutput(payload);

    // Store result
    const { data, error } = await learningRequestModel.insert(
      resourceId,
      "mindmap",
      "completed",
      {
        input: { textLength: text.length, pageCount: merged.pages.length },
        output: payload,
      },
    );

    if (error) {
      throw new Error(error.message || "Failed to persist mindmap");
    }

    requestRecord = data || null;
    console.log(
      `[mindmapService] Mindmap successfully generated and stored for resource ${resourceId}`
    );

    return {
      request: requestRecord,
      mindmap: payload.mindmap,
    };
  } catch (err) {
    console.error(
      `[mindmapService] Error generating mindmap for resource ${resourceId}: ${err.message}`
    );

    if (!requestRecord) {
      await learningRequestModel.insert(resourceId, "mindmap", "failed", {
        error: err.message || "Mindmap generation failed",
      });
    }
    throw err;
  }
}

module.exports = {
  generateMindmap,
};
