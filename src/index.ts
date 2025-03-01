import {
  Client,
  Events,
  GatewayIntentBits,
  CommandInteraction,
  ThreadAutoArchiveDuration,
  ChannelType,
} from "discord.js";
import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core";
import { mastraDocsHelper } from "./mastra/agents";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const mastra = new Mastra({
  agents: { mastraDocsHelper },
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

    // First reply to acknowledge the command
    await interaction.reply({
      content: `Processing your question: "${question}"`,
    });

    // Fetch the reply message after sending it
    const replyMessage = await interaction.fetchReply();

    // Check if the interaction was in a text channel
    if (
      !interaction.channel ||
      interaction.channel.type !== ChannelType.GuildText
    ) {
      await interaction.editReply(
        "This command can only be used in a text channel."
      );
      return;
    }

    // Create a thread from the message
    const thread = await interaction.channel.threads.create({
      name: `Agent Query: ${question.substring(0, 50)}${question.length > 50 ? "..." : ""}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      startMessage: replyMessage.id,
      reason: "Agent query thread",
    });

    // Send a processing message in the thread
    await thread.send("Generating response...");

    // Process the agent request
    const agent = await mastra.getAgent("mastraDocsHelper");
    const response = await agent.generate(question);
    const result: string = response.text;

    // Check if the result is longer than Discord's 2000 character limit
    if (result.length <= 2000) {
      // If it's under the limit, send the entire response at once
      await thread.send(result);
    } else {
      // If it's over the limit, split into chunks and send each one
      const chunkSize = 1950; // Using 1950 to leave some buffer space
      let chunks = [];

      for (let i = 0; i < result.length; i += chunkSize) {
        chunks.push(result.substring(i, i + chunkSize));
      }

      // Send all chunks as separate messages in the thread
      for (const chunk of chunks) {
        await thread.send(chunk);
      }
    }

    // Update the original reply to indicate completion
    await interaction.editReply({
      content: `Your question has been answered in the thread.`,
    });
  } catch (error) {
    console.error("Error handling /agent command:", error);
    try {
      // If the interaction hasn't been replied to yet
      if (!interaction.replied) {
        await interaction.reply({
          content: "An error occurred while processing your question.",
        });
      } else {
        // If already replied, edit the reply
        await interaction.editReply({
          content: "An error occurred while processing your question.",
        });
      }
    } catch (followupError) {
      console.error("Error sending error message:", followupError);
    }
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
