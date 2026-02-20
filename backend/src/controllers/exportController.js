const LearningRequestModel = require("../models/learningRequestModel");
const learningModel = new LearningRequestModel();
const validateNotes = require("../services/export/validateNotes");
const mapNotesToDocumentModel = require("../services/export/mapperService");
const generatePdf = require("../services/export/pdfService");
const generateDocx = require("../services/export/docxService");

async function fetchAndValidateNotes(resourceId, res) {
  const { data, error } = await learningModel.getByResourceId(resourceId);

  if (error) {
    res.status(500).json({
      error: "Database error",
      details: error.message,
    });
    return null;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    res.status(404).json({ error: "Notes not found" });
    return null;
  }

  const latestRecord = data[0];
  const structured = latestRecord.generated_content?.output;

  if (!structured?.notes) {
    res.status(400).json({ error: "No structured notes available" });
    return null;
  }

  try {
    validateNotes(structured.notes);
  } catch (validationError) {
    res.status(400).json({
      error: "Invalid notes format",
      details: validationError.message,
    });
    return null;
  }

  return structured.notes;
}

async function exportPdf(req, res) {
  try {
    const { resourceId } = req.params;

    const notes = await fetchAndValidateNotes(resourceId, res);
    if (!notes) return;

    const documentModel = mapNotesToDocumentModel(notes);

    const filename = `Study-Notes-${resourceId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return generatePdf(documentModel, res);
  } catch (err) {
    console.error(err);

    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

async function exportDocx(req, res) {
  try {
    const { resourceId } = req.params;

    const notes = await fetchAndValidateNotes(resourceId, res);
    if (!notes) return;

    const documentModel = mapNotesToDocumentModel(notes);
    const buffer = await generateDocx(documentModel);

    const filename = `Study-Notes-${resourceId}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(buffer);
  } catch (err) {
    console.error(err);

    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = {
  exportPdf,
  exportDocx,
};
