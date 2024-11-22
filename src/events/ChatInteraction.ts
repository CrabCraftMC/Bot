import type { ChatInputCommandInteraction } from "discord.js";
import { commands } from "../index.js";
import Event from "../structures/Event.js";
import logger from "../utils/logger.js";
import { errorEmbed } from "../utils/embeds.js";

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("ChatInteraction", "interactionCreate", false);
  }

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      logger.error(
        `Unknown command ${interaction.commandName} executed by ${interaction.user.username}`
      );
      return void (await interaction.reply({
        embeds: [
          errorEmbed(
            "",
            "**Error!** There was an error executing this command"
          ),
        ],
      }));
    }

    if (command.options?.guildOnly && !interaction.guild)
      return void (await interaction.reply({
        embeds: [
          errorEmbed(
            "",
            "**Error!** This command can only be used in a server"
          ),
        ],
      }));

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(
        `Error executing command ${interaction.commandName} by ${interaction.user.username}`,
        error
      );
    }
  }
}
