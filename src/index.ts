import {
  Client,
  Events,
  GatewayIntentBits,
  CommandInteraction,
  ThreadAutoArchiveDuration,
  ChannelType,
  Message,
  ThreadChannel,
} from "discord.js";
import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core";
// import { mastraDocsHelper } from "./mastra/agents";
import { simpleAgent } from "./mastra/agents";

// Store active threads and their original users
const activeThreads = new Map<string, string>(); // Map<threadId, userId>

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const mastra = new Mastra({
  agents: { simpleAgent },
  logger: createLogger({
    name: "CONSOLE",
    level: "info",
  }),
});

// const agent = await mastra.getAgent("mastraDocsHelper");
const agent = await mastra.getAgent("simpleAgent");

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

// Listen for messages in threads
client.on(Events.MessageCreate, async (message: Message) => {
  // If message is not in a thread or was sent by the bot, ignore it
  if (!message.channel.isThread() || message.author.bot) return;

  const threadId = message.channel.id;
  const userId = message.author.id;

  // Check if this thread is one we're tracking and if the message is from the original user
  if (activeThreads.has(threadId) && activeThreads.get(threadId) === userId) {
    console.log(
      "Message received in threadId " + threadId + ", from userId: " + userId
    );
    // Process the agent request
    const userReply = message.content;
    const agentResponse = await agent.generate(userReply, {
      threadId: threadId,
      resourceId: userId,
    });
    const result: string = agentResponse.text;
    await message.reply(result);
  }
});

// Listen for thread deletion or archiving to clean up the Map
client.on(Events.ThreadDelete, (thread: ThreadChannel) => {
  if (activeThreads.has(thread.id)) {
    activeThreads.delete(thread.id);
    console.log(`Thread ${thread.id} deleted and removed from tracking.`);
  }
});

client.on(
  Events.ThreadUpdate,
  (oldThread: ThreadChannel, newThread: ThreadChannel) => {
    // If thread was archived, remove it from our tracking
    if (
      !oldThread.archived &&
      newThread.archived &&
      activeThreads.has(newThread.id)
    ) {
      activeThreads.delete(newThread.id);
      console.log(`Thread ${newThread.id} archived and removed from tracking.`);
    }
  }
);

async function handleAgentCommand(interaction: CommandInteraction) {
  try {
    const userDiscordId = interaction.user.id;
    console.log(`User ${userDiscordId} initiated agent command`);

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

    // Store the thread ID and user ID in our tracking map
    activeThreads.set(thread.id, interaction.user.id);
    console.log(
      `Thread ${thread.id} created and tracked for user ${interaction.user.id}`
    );

    // Send a processing message in the thread
    await thread.send("Generating response...");

    // Process the agent request
    const response = await agent.generate(question, {
      threadId: thread.id,
      resourceId: interaction.user.id,
    });
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

// Clean up stale threads function (optional, can be called periodically)
async function cleanupStaleThreads() {
  for (const [threadId, userId] of activeThreads.entries()) {
    try {
      // Try to fetch the thread - will throw an error if it no longer exists
      const thread = (await client.channels.fetch(threadId)) as ThreadChannel;

      // If thread exists but is archived, remove it from our tracking
      if (thread.archived) {
        activeThreads.delete(threadId);
        console.log(
          `Cleaned up archived thread ${threadId} during maintenance`
        );
      }
    } catch (error) {
      // Thread likely no longer exists
      activeThreads.delete(threadId);
      console.log(
        `Cleaned up non-existent thread ${threadId} during maintenance`
      );
    }
  }

  console.log(
    `Cleanup complete. Currently tracking ${activeThreads.size} active threads.`
  );
}

// Call this once to register commands
registerCommands();

// Optional: Set up periodic cleanup every 12 hours
// setInterval(cleanupStaleThreads, 12 * 60 * 60 * 1000);

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
