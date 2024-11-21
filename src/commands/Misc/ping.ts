import SlashCommand from "@/structures/SlashCommand";
import { primaryEmbed } from "@/utils/embeds";
import type { ChatInputCommandInteraction } from "discord.js";

export default class PingCommand extends SlashCommand {
  constructor() {
    super("ping", "Replies with Pong!");
  }

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const ping = interaction.client.ws.ping;

    await interaction.editReply({
      embeds: [
        primaryEmbed(
          "",
          `Currently latency is: [\`${ping}ms\`](https://discord.com/channels/${interaction.guild?.id}/${interaction.channel?.id}/${interaction.id})`
        ),
      ],
    });
  }
}
