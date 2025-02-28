// Example of creating a Context Menu Option
import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ContextMenuCommandInteraction,
  ApplicationCommandType,
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// When the client is ready, run this code
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Handle context menu interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isMessageContextMenuCommand()) return;

  if (interaction.commandName === "Create Issue") {
    await handleIssueCommand(interaction);
  }
});

async function handleIssueCommand(interaction: ContextMenuCommandInteraction) {
  try {
    // Access the message the user right-clicked
    const targetMessage = await interaction.channel?.messages.fetch(
      interaction.targetId
    );
    if (!targetMessage) return;

    // Log the message content to console
    console.log("Issue reported for message:");
    console.log(`ID: ${targetMessage.id}`);
    console.log(`Author: ${targetMessage.author.tag}`);
    console.log(`Content: ${targetMessage.content}`);

    // Confirm to the user
    await interaction.reply({
      content: "Issue logged successfully!",
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error("Error handling issue command:", error);
    await interaction.reply({
      content: "An error occurred while processing your issue report.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Register context menu command (run this once during bot setup)
async function registerCommands() {
  try {
    const { REST, Routes } = await import("discord.js");
    const rest = new REST().setToken(process.env.DISCORD_TOKEN || "");

    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID || ""), {
      body: [
        {
          name: "Create Issue",
          type: ApplicationCommandType.Message, // This makes it a message context menu command
        },
      ],
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

// Call this once to register commands
registerCommands();

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
