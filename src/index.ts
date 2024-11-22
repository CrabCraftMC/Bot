import { Client, Collection, GatewayIntentBits } from "discord.js";
import logger from "@/utils/logger";
import config from "@/utils/config";

logger.info("Starting Crabby...");

import { loadCommands } from "./handlers/commands";
import { loadEvents } from "./handlers/events";

import type SlashCommand from "@/structures/SlashCommand";

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
    parse: ["users"],
  },
});

export const commands: Collection<string, SlashCommand> = new Collection();

logger.info("Loading commands...");
await loadCommands();
logger.info("Loading events...");
await loadEvents();

client.login(config.TOKEN);

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
});
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
});
