import Event from "@/structures/Event";
import config from "@/utils/config";
import { primaryEmbed } from "@/utils/embeds";
import type { Message, TextChannel } from "discord.js";

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("DiscCreator", "messageCreate", false);
  }

  async execute(message: Message) {
    if (message.author.bot) return;
    if (message.channelId !== config.CD_CREATOR_CHANNEL_ID) return;

    if (message.attachments.size == 0) {
      message.delete();
      (message.channel as TextChannel)
        .send(`${message.author}, you must attach a file to your message!`)
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
      return;
    }

    if (message.attachments.size > 1) {
      message.delete();
      (message.channel as TextChannel)
        .send(`${message.author}, you can only attach one file at a time!`)
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
      return;
    }

    const attachment = message.attachments.first();

    if (!attachment) {
      message.delete();
      (message.channel as TextChannel)
        .send(`${message.author}, unable to fetch attachment!`)
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
      return;
    }

    if (
      !attachment.name?.endsWith(".mp3") &&
      !attachment.name?.endsWith(".wav") &&
      !attachment.name?.endsWith(".flac") &&
      attachment.contentType !== "audio/mpeg" &&
      attachment.contentType !== "audio/wav" &&
      attachment.contentType !== "audio/flac"
    ) {
      message.delete();
      (message.channel as TextChannel)
        .send(
          `${message.author}, the file must be a \`.mp3\`, \`.wav\`, or \`.flac\` file!`
        )
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
      return;
    }

    const UID = Math.random().toString(36).substring(2, 10);
    const fileExtension = attachment.name?.split(".").pop();

    (message.channel as TextChannel)
      .send({
        embeds: [
          primaryEmbed(
            "💿 Disc Creator",
            `Copy and paste the commands below to create a custom music disc in-game.\n\n**1.** \`/cd download ${attachment.url} ${UID}.${fileExtension}\`\n\n**2.** \`/cd create ${UID}.${fileExtension} "REPLACE WITH DISC NAME"\``
          ),
        ],
      })
      .then((msg) => {
        setTimeout(() => {
          msg.delete();
          message.delete();
        }, 300000);
      });
  }
}
