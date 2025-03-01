import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const createIssue = async (issue: {
  title: string;
  body?: string;
  labels?: string[];
}) => {
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_REPO || !GITHUB_OWNER || !GITHUB_TOKEN) {
    throw new Error("Missing required environment variables");
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(issue),
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return await response.json();
};

export const createGithubIssue = createTool({
  id: "Create GitHub Issue",
  inputSchema: z.object({
    title: z.string(),
    body: z.string().optional(),
  }),
  description:
    "Creates a GitHub issue in a predefined project with predefined tags.",
  execute: async ({ context: { title, body } }) => {
    console.log("Creating GitHub issue:", title);
    return await createIssue({
      title,
      body: body || "",
      labels: ["bug", "enhancement"], // Adjust labels as needed
    });
  },
});
