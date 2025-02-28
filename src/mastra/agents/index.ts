import { createAzure } from "@ai-sdk/azure";
import { Agent } from "@mastra/core/agent";
import { readFile } from "fs/promises"; // Import readFile from fs/promises
import path from "path"; // Import path module
import { fileURLToPath } from "url";

import { instructions } from "./instructions";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

async function loadText() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, "docs.txt"); // Adjust filename and path

    const text = await readFile(filePath, "utf-8");
    return text;
  } catch (error) {
    console.error("Error loading text file:", error);
    return ""; // Return empty string or handle error appropriately.
  }
}

export const mastraDocsHelper = new Agent({
  name: "MastraDocsHelper",
  instructions: `${instructions} ${await loadText()}`, // Await the result of loadText()
  model: azure("gpt-4o-mini"),
  // tools: { weatherTool },
});
