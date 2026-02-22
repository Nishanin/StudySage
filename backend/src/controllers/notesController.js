const notesService = require("../services/notesService");
const LearningRequestModel = require("../models/learningRequestModel");
const ResourceModel = require("../models/resourceModel");
const supabase = require("../supabase");

const learningRequestModel = new LearningRequestModel();
const resourceModel = new ResourceModel();

async function validateResourceOwnership(resourceId, userId) {
  const { data: resource, error: resourceError } =
    await resourceModel.getById(resourceId);

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

async function generateNotes(req, res) {
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

    const data = await notesService.generateNotes(resourceId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: { message: err.message || "Notes generation failed" },
    });
  }
}

async function getNotes(req, res) {
  try {
    const { resourceId } = req.params;
    const userId = "de9fd445-8732-424f-95b2-446c8bddab1b";

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        error: { message: "resourceId is required" },
      });
    }

    await validateResourceOwnership(resourceId, userId);

    const { data, error } =
      await learningRequestModel.getByResourceId(resourceId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Failed to fetch notes" },
      });
    }

    const notes = (data || []).filter((item) => item.request_type === "notes");

    return res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: { message: err.message || "Failed to fetch notes" },
    });
  }
}

function renderNotesToMarkdown(notes) {
  const docs = Array.isArray(notes)
    ? notes
    : notes && typeof notes === "object"
      ? [notes]
      : [];
  if (!docs.length) return "";

  let md = "";
  for (const doc of docs) {
    // Add pages[].text if present
    if (Array.isArray(doc.pages)) {
      for (const page of doc.pages) {
        if (page.text) {
          md += `${page.text}\n\n`;
        }
      }
    }
    // Add sections as before
    const sections = Array.isArray(doc?.sections) ? doc.sections : [];
    for (const section of sections) {
      md += `## ${section.title}\n\n`;
      const blocks = Array.isArray(section?.blocks) ? section.blocks : [];
      for (const block of blocks) {
        if (block.type === "paragraph") {
          md += (block.content || "") + "\n\n";
        } else if (block.type === "definition") {
          md += `> **${block.term || ""}**\n> ${block.definition || ""}\n\n`;
        } else if (block.type === "list") {
          const items = Array.isArray(block.items)
            ? block.items
            : Array.isArray(block.content)
              ? block.content
              : [];
          for (const item of items) {
            if (typeof item === "string" && item.trim()) {
              md += `- ${item.trim()}\n`;
            } else if (item?.type === "paragraph" && item?.content) {
              md += `- ${item.content}\n`;
            } else if (item?.content) {
              md += `- ${item.content}\n`;
            }
          }
          md += "\n";
        } else if (block.type === "code") {
          md += renderCode(block.content || "") + "\n\n";
        } else if (block.type === "equation") {
          md += `$$\n${block.content || ""}\n$$\n\n`;
        }
      }
    }
  }
  return md.trim();
}

function renderCode(content) {
  // Always fenced, blank line after
  return `\`\`\`\n${content}\n\`\`\``;
}

// Returns true if the text is a standalone equation (block math)
function isStandaloneEquation(text) {
  if (!text || typeof text !== "string") return false;
  // Must contain =, ≠, ≤, ≥, or similar
  if (!/[=≠≤≥]/.test(text)) return false;
  // Should be short
  if (text.length > 80) return false;
  // Should not contain too much natural language (no more than 3 words before/after main symbol)
  // Split on =, ≠, ≤, ≥
  const parts = text.split(/[=≠≤≥]/);
  if (parts.length !== 2) return false;
  // Each side should be short (no long sentences)
  if (
    parts[0].trim().split(/\s+/).length > 5 ||
    parts[1].trim().split(/\s+/).length > 7
  )
    return false;
  // Should not end with a period
  if (text.trim().endsWith(".")) return false;
  // Should contain mostly symbols, variables, numbers
  // Heuristic: at least 40% non-letter chars
  const nonAlpha = text.replace(/[a-zA-Z\s]/g, "");
  if (nonAlpha.length / text.length < 0.2) return false;
  return true;
}

// Safely wrap only valid inline math tokens in $...$
function wrapInlineMath(text) {
  if (!text || typeof text !== "string") return text;
  // Split by space, but keep punctuation as separate tokens
  const tokens = text.match(/([a-zA-Z0-9_\^\+\-\*\/\(\)=≠≤≥]+|[^\s\w])/g) || [];
  let result = [];
  let mathSeq = [];
  let i = 0;
  const isMathToken = (tok) => {
    // Accept numbers, variables (max 3 chars), operators, parens, mod
    if (/^(mod|[a-zA-Z]{1,3}\d{0,2}|[0-9]+|[=≠≤≥\^\+\-\*\/\(\)_])$/.test(tok))
      return true;
    return false;
  };
  const flushMath = () => {
    if (mathSeq.length > 0) {
      const mathStr = mathSeq.join(" ");
      // Only wrap if short and not already wrapped
      if (
        mathStr.length <= 40 &&
        /[=≠≤≥\^]/.test(mathStr) &&
        !mathStr.includes("$")
      ) {
        result.push(`$${mathStr}$`);
      } else {
        result.push(mathStr);
      }
      mathSeq = [];
    }
  };
  while (i < tokens.length) {
    const tok = tokens[i];
    // Never wrap if punctuation is adjacent
    if (isMathToken(tok)) {
      mathSeq.push(tok);
    } else {
      flushMath();
      result.push(tok);
    }
    i++;
  }
  flushMath();
  // Rebuild sentence, collapse extra spaces
  return result
    .join(" ")
    .replace(/ +([.,;:!?)])/g, "$1")
    .replace(/([($]) +/g, "$1")
    .replace(/ +/g, " ")
    .trim();
}

async function getNotesMarkdown(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Note id is required" } });
    }
    const { data, error } = await learningRequestModel.getByResourceId(id);
    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Failed to fetch notes" },
      });
    }
    let noteRecord = (data || []).find(
      (item) =>
        item.request_type === "notes" &&
        item.status === "completed" &&
        item?.generated_content?.output?.notes,
    );

    // Fallback: allow direct lookup by learning_requests.id for resilience.
    if (!noteRecord) {
      const { data: directRecord, error: directError } = await supabase
        .from("learning_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (directError) {
        return res.status(500).json({
          success: false,
          error: { message: directError.message || "Failed to fetch notes" },
        });
      }

      if (
        directRecord &&
        directRecord.request_type === "notes" &&
        directRecord.status === "completed"
      ) {
        noteRecord = directRecord;
      }
    }

    if (!noteRecord) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Note not found" } });
    }
    const notes = noteRecord?.generated_content?.output?.notes;
    if (!notes) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Notes content missing" } });
    }
    const markdown = renderNotesToMarkdown(notes);
    let validation = null;
    if (noteRecord.validation_json) {
      try {
        validation = JSON.parse(noteRecord.validation_json);
      } catch (_) {
        validation = null;
      }
    }
    if (!validation) {
      validation = noteRecord?.generated_content?.output?.validation || null;
    }

    return res.status(200).json({ success: true, markdown, validation });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: { message: err.message || "Failed to render notes markdown" },
    });
  }
}

module.exports = {
  generateNotes,
  getNotes,
  getNotesMarkdown,
};
