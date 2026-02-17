function buildPrompt({ question, chunks = [], history = [], context }) {
  let contextSentence = "";
  if (context) {
    if (context.type === "pdf" && typeof context.page === "number") {
      contextSentence = `The student is currently viewing page ${context.page}`;
    } else if (context.type === "ppt" && typeof context.slide === "number") {
      contextSentence = `The student is currently viewing slide ${context.slide}`;
    } else if (
      context.type === "video" &&
      typeof context.timestamp === "number"
    ) {
      contextSentence = `The student is currently at timestamp ${context.timestamp} seconds`;
    }
  }

  const studyChunks = chunks.slice(0, 6);
  const studyMaterial = studyChunks
    .map((chunk) => {
      let ref = "";
      if (chunk.page_number != null) ref = `(Page ${chunk.page_number})`;
      else if (chunk.slide_number != null)
        ref = `(Slide ${chunk.slide_number})`;
      else if (chunk.timestamp != null) ref = `(Time ${chunk.timestamp} sec)`;

      return `--- SOURCE START ---
${ref}
${chunk.text}
--- SOURCE END ---`;
    })
    .join("\n\n");

  const historySection = history
    .map((msg) => {
      const role = msg.role === "assistant" ? "Assistant" : "User";
      return `${role}: ${msg.content}`;
    })
    .join("\n");

  // SYSTEM RULES (strong grounding)
  const instruction = `
### SYSTEM RULES ###
You are a helpful study tutor.

You MUST follow these rules:
1) Answer only using the provided study material
2) Do not use outside knowledge
3) If answer not found, reply exactly:
"The answer is not available in the provided material."
4) Always cite sources like (Page 5)
`;

  let prompt = `${instruction}\n`;

  if (contextSentence)
    prompt += `### STUDENT CONTEXT ###\n${contextSentence}\n\n`;

  prompt += `### STUDY MATERIAL ###\n${studyMaterial || "No material provided."}\n\n`;

  if (historySection) prompt += `### CONVERSATION ###\n${historySection}\n\n`;

  prompt += `### QUESTION ###\n${question}`;

  return prompt;
}

module.exports = { buildPrompt };
