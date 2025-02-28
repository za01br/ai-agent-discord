import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  TextChannel,
} from "discord.js";
import { config } from "dotenv";
import { isQuestion } from "./utils/utils";

// Load environment variables
config();

// Create a new client instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Channel ID to monitor
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID || "";

// Event listener when the bot is ready
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  console.log(`Monitoring channel ID: ${TARGET_CHANNEL_ID}`);
});

// Event listener for messages
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot messages and messages from other channels
  if (message.author.bot || message.channelId !== TARGET_CHANNEL_ID) return;

  //Ignore messages that are not question
  if (!isQuestion(message.content)) {
    console.log("Not a question!");
    return;
  }

  // Log the message to console
  console.log(
    `[ChannelId: ${message.channelId}]|[${message.author.tag}]: ${message.content}`
  );
  // Process the message (placeholder for future functionality)
  // ... your processing logic will go here ...

  // Reply to the user with a confirmation
  https: try {
    await message.reply(`<@${message.author.id}> message received it`);
  } catch (error) {
    console.error("Error replying to message:", error);
  }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
