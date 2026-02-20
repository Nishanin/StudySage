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
  const result = notesSchema.safeParse(notes);

  if (!result.success) {
    console.error("Validation issues:", result.error.issues);
    throw new Error(JSON.stringify(result.error.issues));
  }

  return true;
}

module.exports = validateNotes;
