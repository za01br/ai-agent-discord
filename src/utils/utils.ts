//TODO: Fix for questions with a suggestion intent, like: "why not just import mastra everywhere you need it?"
export function isQuestion(text: string): boolean {
  if (!text || typeof text !== "string") return false; // Validate input

  text = text.trim(); // Remove extra spaces

  // Split text into sentences using `. ! ?` as delimiters
  const sentences: string[] | null = text.match(/[^.!?]+[.!?]?/g);
  if (!sentences) return false;

  // Common question words
  const questionWords: Set<string> = new Set([
    "who",
    "what",
    "when",
    "where",
    "why",
    "how",
    "which",
    "whose",
    "is",
    "are",
    "am",
    "do",
    "does",
    "did",
    "can",
    "could",
    "should",
    "would",
    "will",
    "have",
    "has",
    "had",
  ]);

  for (let sentence of sentences) {
    let trimmed: string = sentence.trim();

    // Check if the sentence ends with a question mark
    if (trimmed.endsWith("?")) {
      return true;
    }

    // Extract first word of the sentence
    let firstWord: string = trimmed.split(/\s+/)[0].toLowerCase();

    // Check if it starts with a question word
    if (questionWords.has(firstWord)) {
      return true;
    }
  }

  return false; // No sentence was a question
}
