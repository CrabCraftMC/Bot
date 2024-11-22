import Event from "../structures/Event.js";
import config from "../utils/config.js";
import { primaryEmbed } from "../utils/embeds.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  type GuildMember,
} from "discord.js";

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("MemberJoined", "guildMemberAdd", false);
  }

  async execute(member: GuildMember) {
    if (member.user.bot) return;

    let channel = member.guild.channels.cache.find(
      (channel) => channel.name === `app-${member.user.username}`
    ) as TextChannel | undefined;

    if (!channel) {
      channel = await member.guild.channels.create({
        name: `app-${member.user.username}`,
        type: ChannelType.GuildText,
        parent: config.APPLICATION_CATEGORY_ID,
        permissionOverwrites: [
          {
            id: member.user.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });
    } else {
      await channel.permissionOverwrites.create(member.user.id, {
        ViewChannel: true,
      });

      channel.send({
        content: `<..!${member.user.id}>`,
      });
      return;
    }

    const applicationEmbed = primaryEmbed(
      "Welcome to 🦀 CrabCraft",
      "To submit an application, please click the button below this message to submit an application."
    ).setFooter({ text: "Any problems? Send a message in this channel." });

    const applyButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("apply")
        .setLabel("Apply")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📝")
    );

    channel.send({
      content: `<..!${member.user.id}>`,
      embeds: [applicationEmbed],
      components: [applyButton],
    });
  }
}
