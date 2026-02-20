/**
 * Converts structured notes JSON into a normalized flat document model.
 * @param {Object} notes
 * @returns {Array} Document model array
 */
function mapNotesToDocumentModel(notes) {
  if (!notes || !Array.isArray(notes.sections)) return [];

  const doc = [];

  for (const section of notes.sections) {
    // ---------------------------
    // Heading
    // ---------------------------
    if (section.title && typeof section.title === "string") {
      doc.push({
        type: "heading",
        level: 1,
        text: section.title.trim(),
      });
    }

    // ---------------------------
    // Blocks
    // ---------------------------
    if (Array.isArray(section.blocks)) {
      for (const block of section.blocks) {
        // Paragraph
        if (block.type === "paragraph" && typeof block.content === "string") {
          doc.push({
            type: "paragraph",
            text: block.content.trim(),
          });
        }

        // List
        else if (block.type === "list" && Array.isArray(block.content)) {
          const normalizedItems = block.content
            .map((item) => normalizeListItem(item))
            .filter(Boolean); // remove empty/null

          if (normalizedItems.length > 0) {
            doc.push({
              type: "bulletList",
              items: normalizedItems,
            });
          }
        }
      }
    }

    // Optional spacing between sections
    doc.push({ type: "spacer" });
  }

  return doc;
}

/**
 * Normalizes list items into clean strings.
 */
function normalizeListItem(item) {
  if (!item) return null;

  // Case 1: string
  if (typeof item === "string") {
    return item.trim();
  }

  // Case 2: object with text
  if (typeof item === "object") {
    if (item.text) return item.text.trim();

    if (item.title && item.description)
      return `${item.title}: ${item.description}`;

    if (item.title) return item.title.trim();

    if (item.description) return item.description.trim();

    // Fallback (rare case)
    return JSON.stringify(item);
  }

  return null;
}

module.exports = mapNotesToDocumentModel;
