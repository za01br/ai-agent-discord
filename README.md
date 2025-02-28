# AI Agent/Discord Bot

A Discord bot powered by an AI Agent built with [Mastra AI](https://mastra.ai/).

## Getting Started

Follow these steps to set up and run the bot:

### 1. Set up your bot on Discord

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Create a new application and then create a bot within that application.
3.  Copy your bot's token. You will need this later.
4.  Copy your application ID. You will also need this later.
5.  Invite your bot to your Discord server by using the OAuth2 URL Generator in the Discord Developer Portal.

### 2. Clone the project

```bash
gh repo clone za01br/ai-agent-discord
cd discord-bot
```

### 3. Install dependencies

```bash
bun install
```

### 4. Configure environment variables

Rename `.env.placeholder` to `.env`.

Open `.env`and replace the placeholder keys with your actual keys:

DISCORD_TOKEN=Your_bot_token
APPLICATION_ID=Your_bot_app_id
GOOGLE_GENERATIVE_AI_API_KEY=Your_google_gemini_api_key

### 5. Run

```bash
bun run dev
```
