import logger from "../utils/logger.js";
import { Routes, SlashCommandBuilder, type Client } from "discord.js";
import Event from "../structures/Event.js";
import { start } from "../index.js";
import config from "../utils/config.js";
import { commands } from "../index.js";

export default class ReadyEvent extends Event {
  constructor() {
    super("BotReady", "ready", true);
  }

  async execute(client: Client) {
    logger.info(
      `${client.user?.tag} logged into Discord in ${Date.now() - start}ms`
    );

    // Deploy slash commands
    if (!client.user) return;

    const startupArgs = process.argv.slice(2);

    if (startupArgs.includes("-D") || startupArgs.includes("--deploy")) {
      logger.debug(
        `Deploying slash commands to Discord ${
          config.ENV === "development" ? "locally" : "globally"
        }`
      );
      const commandData: any[] = [];

      await Promise.all(
        commands.map(async (command) => {
          commandData.push(
            await command.build(
              new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.description)
            )
          );
        })
      );

      if (config.ENV === "development") {
        const devGuild = client.guilds.cache.get(config.DEV_GUILD_ID);
        if (!devGuild) return void logger.error("DEV_GUILD_ID is not set");
        // const existingCommands = await devGuild.commands.fetch();
        try {
          await client.rest.put(
            Routes.applicationGuildCommands(client.user.id, devGuild.id),
            { body: commandData }
          );
          logger.debug(`Deployed all local slash commands`);
        } catch (error) {
          logger.error(error);
        }
      }

      // TODO: Production slash command deployment
    }
  }
}
