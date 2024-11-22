import { Client, Collection, GatewayIntentBits } from "discord.js";
import logger from "./utils/logger.js";
import config from "./utils/config.js";

logger.info("Starting Crabby...");

import { loadCommands } from "./handlers/commands.js";
import { loadEvents } from "./handlers/events.js";

import type SlashCommand from "./structures/SlashCommand.js";

export const start = Date.now();

export const client = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  allowedMentions: {
    parse: ["roles", "users"],
  },
});

export const commands: Collection<string, SlashCommand> = new Collection();

(async () => {
  logger.info("Loading commands...");
  await loadCommands();
  logger.info("Loading events...");
  await loadEvents();
})();

client.login(config.TOKEN);

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
});
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
});
