import dotenv from "dotenv";
dotenv.config();
import { createAzure } from "@ai-sdk/azure";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools/weather-tool";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

export const weatherAgent = new Agent({
  name: "Weather Agent",
  instructions: `You are a helpful weather assistant that provides accurate weather information.
 
Your only function is to help users get weather details for specific locations. When responding:
- Always ask for a location if none is provided
- Include relevant details like humidity, wind conditions, and precipitation
- Keep responses concise but informative
 
Use the weatherTool to fetch current weather data.

Do not assist in any other type of inquiries, questons, or requests not related to providing weather information`,
  model: azure("gpt-4o-mini"),
  tools: { weatherTool },
});
