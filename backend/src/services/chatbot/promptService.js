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
  let instruction = `
### SYSTEM RULES ###
You are a helpful study tutor.

You MUST follow these rules:
1) Answer only using the provided study material
2) Do not use outside knowledge
3) If answer not found, reply exactly:
"The answer is not available in the provided material."
4) Always cite sources like (Page 5)
`;

  // Add support for mode === "reexplain"
  if (context && context.mode === "reexplain") {
    instruction = `
### SYSTEM RULES ###
You are a helpful study tutor.

You MUST follow these rules:
1) Re-explain the same concept more simply, using clearer and simpler language.
2) Break down complex terms and use shorter sentences.
3) Avoid technical jargon where possible.
4) Assume the student is confused; maintain a supportive and patient tone.
5) Keep the answer concise (100–150 words).
6) Answer strictly using the retrieved study material. Do NOT introduce new information.
7) Do NOT mention “context”, “provided material”, or “previous answer”.
8) Do NOT explain your reasoning process.
9) If the answer is not found in the retrieved material, reply exactly:
"The material does not contain that information."
10) Always cite sources like (Page 5).
`;
  }

  let prompt = `${instruction}\n`;

  if (contextSentence)
    prompt += `### STUDENT CONTEXT ###\n${contextSentence}\n\n`;

  prompt += `### STUDY MATERIAL ###\n${studyMaterial || "No material provided."}\n\n`;

  if (historySection) prompt += `### CONVERSATION ###\n${historySection}\n\n`;

  prompt += `### QUESTION ###\n${question}`;

  return prompt;
}

module.exports = { buildPrompt };
