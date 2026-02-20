// Normalize list items: convert objects with 'content' to string for validation
function normalizeNoteBlocks(notes) {
  if (!notes || !Array.isArray(notes.sections)) return notes;
  for (const section of notes.sections) {
    if (!Array.isArray(section.blocks)) continue;
    for (const block of section.blocks) {
      // Accept both 'items' and 'content' for list blocks, normalize to 'content'
      if (block && block.type === "list") {
        // If 'items' exists, use it; else use 'content'
        let itemsArr = Array.isArray(block.items) ? block.items : block.content;
        if (Array.isArray(itemsArr)) {
          block.content = itemsArr.map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object" && "content" in item)
              return item.content;
            return item;
          });
        } else {
          block.content = [];
        }
        // Remove 'items' if present
        if (block.items) delete block.items;
      }
    }
  }
  return notes;
}
const { z } = require("zod");

const listItemSchema = z.union([
  z.string(),
  z.object({
    text: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
]);

const blockSchema = z.union([
  z.object({
    type: z.literal("paragraph"),
    content: z.string(),
  }),
  z.object({
    type: z.literal("list"),
    content: z.array(listItemSchema),
  }),
  z.object({
    type: z.literal("code"),
    content: z.string(),
  }),
  z.object({
    type: z.literal("definition"),
    term: z.string(),
    definition: z.string(),
  }),
]);

const notesSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      blocks: z.array(blockSchema),
    }),
  ),
});

function validateNotes(notes) {
  const normalized = normalizeNoteBlocks(notes);
  console.log(JSON.stringify(notes.sections[1].blocks[1], null, 2));
  const result = notesSchema.safeParse(normalized);
  if (!result.success) {
    console.error("Validation issues:", result.error.issues);
    throw new Error(JSON.stringify(result.error.issues));
  }
  return true;
}

module.exports = validateNotes;
