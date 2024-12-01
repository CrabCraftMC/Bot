import SlashCommand from "../../structures/SlashCommand.js";
import { primaryEmbed } from "../../utils/embeds.js";
import {
  InteractionResponse,
  type ChatInputCommandInteraction,
} from "discord.js";

export default class StatusCommand extends SlashCommand {
  constructor() {
    super("status", "View current server status");
  }

  async execute(interaction: ChatInputCommandInteraction) {
    const emoji = interaction.guild?.emojis.cache.find(
      (emoji) => emoji.name === "loading"
    );
    await interaction.reply({
      content: `${emoji} Pinging \`cc.mxuk.me\`...`,
    });

    const serverInfo = await fetch(
      "https://api.mcsrvstat.us/2/cc.mxuk.me"
    ).then((res) => res.json());

    await interaction.editReply({
      content: "",
      embeds: [
        primaryEmbed(
          "",
          serverInfo.online
            ? "**Status:** <:ServerOnline:1251574081183285390>"
            : "**Status:** <:ServerOffline:1251574079157309501>"
        )
          .addFields({
            name: `Player List (${serverInfo.players.online})`,
            value: serverInfo.players.list
              ? `\`\`\`${serverInfo.players.list.join("\n")}\`\`\``
              : "No players connected",
          })
          .setAuthor({
            name: "cc.mxuk.me",
            iconURL: interaction.guild?.iconURL()!,
          }),
      ],
    });
  }
}
