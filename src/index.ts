import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  CommandInteraction,
} from "discord.js";
import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core";
import { weatherAgent } from "./mastra/agents";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const mastra = new Mastra({
  agents: { weatherAgent },
  logger: createLogger({
    name: "CONSOLE",
    level: "info",
  }),
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "agent") {
    await handleAgentCommand(interaction);
  }
});

async function handleAgentCommand(interaction: CommandInteraction) {
  try {
    // Get the user's input from the command options
    const question = interaction.options.get("question")?.value as string;

    const agent = await mastra.getAgent("weatherAgent");
    const response = await agent.generate(question);
    const result: string = response.text;

    // Reply with "aha"
    await interaction.reply({
      content: result,
      flags: MessageFlags.Ephemeral, // Make the reply ephemeral (only visible to the user)
    });
  } catch (error) {
    console.error("Error handling /agent command:", error);
    await interaction.reply({
      content: "An error occurred while processing your question.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Register slash command (run this once during bot setup)
async function registerCommands() {
  try {
    const { REST, Routes } = await import("discord.js");
    const rest = new REST().setToken(process.env.DISCORD_TOKEN || "");

    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID || ""),
      {
        body: [
          {
            name: "agent",
            description: "Ask the agent a question",
            options: [
              {
                name: "question",
                description: "The question you want to ask",
                type: 3, // Type 3 corresponds to STRING
                required: true,
              },
            ],
          },
        ],
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

// Call this once to register commands
registerCommands();

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
