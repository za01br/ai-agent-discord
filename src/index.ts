import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  CommandInteraction,
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
    // Immediately defer the reply to acknowledge the interaction and prevent timeout
    // This gives you up to 15 minutes to respond
    await interaction.deferReply({ ephemeral: true });

    // Get the user's input from the command options
    const question = interaction.options.get("question")?.value as string;

    // Process the agent request (which might take time)
    const agent = await mastra.getAgent("mastraDocsHelper");
    const response = await agent.generate(question);
    const result: string = response.text;
    console.log(result);

    // Check if the result is longer than Discord's 2000 character limit
    if (result.length <= 2000) {
      // If it's under the limit, send the entire response at once
      await interaction.editReply({
        content: result,
      });
    } else {
      // If it's over the limit, split into chunks and send each one
      const chunkSize = 1950; // Using 1950 to leave some buffer space
      let chunks = [];

      for (let i = 0; i < result.length; i += chunkSize) {
        chunks.push(result.substring(i, i + chunkSize));
      }

      // Send the first chunk as an edit to the original deferred reply
      await interaction.editReply({
        content: chunks[0],
      });

      // Send the rest of the chunks as separate followups
      for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp({
          content: chunks[i],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  } catch (error) {
    console.error("Error handling /agent command:", error);
    try {
      // If the interaction is still valid, respond with the error
      await interaction.editReply({
        content: "An error occurred while processing your question.",
      });
    } catch (followupError) {
      console.error("Error sending error message:", followupError);
    }
  }
}

// async function handleAgentCommand(interaction: CommandInteraction) {
//   try {
//     // Get the user's input from the command options
//     const question = interaction.options.get("question")?.value as string;

//     const agent = await mastra.getAgent("mastraDocsHelper");
//     const response = await agent.generate(question);
//     const result: string = response.text;
//     console.log(result);

//     // Check if the result is longer than Discord's 2000 character limit
//     if (result.length <= 2000) {
//       // If it's under the limit, send the entire response at once
//       await interaction.reply({
//         content: result,
//         flags: MessageFlags.Ephemeral, // Make the reply ephemeral (only visible to the user)
//       });
//     } else {
//       // If it's over the limit, we need to split it into chunks

//       // First, send initial reply with the first part of the message
//       const chunkSize = 1950; // Using 1950 to leave some buffer space
//       const chunks = [];

//       for (let i = 0; i < result.length; i += chunkSize) {
//         chunks.push(result.substring(i, i + chunkSize));
//       }

//       // Send the first chunk as the reply
//       await interaction.reply({
//         content: chunks[0],
//         flags: MessageFlags.Ephemeral,
//       });

//       // Send the rest of the chunks as separate followups
//       for (let i = 1; i < chunks.length; i++) {
//         await interaction.followUp({
//           content: chunks[i],
//           flags: MessageFlags.Ephemeral,
//         });
//       }
//     }
//   } catch (error) {
//     console.error("Error handling /agent command:", error);
//     await interaction.reply({
//       content: "An error occurred while processing your question.",
//       flags: MessageFlags.Ephemeral,
//     });
//   }
// }

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
