import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { instructions } from "./instructions";

async function loadText() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, "docs.txt");

    const text = await readFile(filePath, "utf-8");
    return text;
  } catch (error) {
    console.error("Error loading text file:", error);
    return "";
  }
}

export const mastraDocsHelper = new Agent({
  name: "MastraDocsHelper",
  instructions: `${instructions} ${await loadText()}`, // Await the result of loadText()
  model: google("gemini-2.0-flash-001"),
});
