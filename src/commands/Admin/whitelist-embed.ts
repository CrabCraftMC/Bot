import SlashCommand from "@/structures/SlashCommand";
import { primaryEmbed } from "@/utils/embeds";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  TextChannel,
  type ChatInputCommandInteraction,
  type RESTPostAPIApplicationCommandsJSONBody,
  type SlashCommandBuilder,
} from "discord.js";

export default class PingCommand extends SlashCommand {
  constructor() {
    super("accesscc", "Sends the direct access embed");
  }

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = primaryEmbed(
      "Access Season 4",
      "Click the button below this message to be whitelisted for Season 4 of the server."
    );

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("fast-apply")
        .setEmoji("🎄")
        .setLabel("Season 4")
        .setStyle(ButtonStyle.Primary)
    );

    (interaction.channel as TextChannel).send({
      embeds: [embed],
      components: [button],
    });

    await interaction.reply({
      content: "The access embed has been sent!",
      ephemeral: true,
    });
  }

  async build(
    command: SlashCommandBuilder
  ): Promise<SlashCommandBuilder | RESTPostAPIApplicationCommandsJSONBody> {
    return command
      .setDefaultMemberPermissions(PermissionFlagsBits.AddReactions)
      .toJSON();
  }
}
