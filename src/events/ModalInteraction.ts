import Event from "@/structures/Event";
import config from "@/utils/config";
import { errorEmbed, primaryEmbed } from "@/utils/embeds";
import Sheet from "@/utils/sheet";
import type {
  GuildMember,
  ModalSubmitInteraction,
  TextChannel,
} from "discord.js";

import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: config.DB_HOST,
  port: parseInt(config.DB_PORT),
  user: config.DB_USER,
  password: config.DB_PASS,
  database: config.DB_NAME,
  connectionLimit: 5,
});

const sheet = new Sheet();

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("ModalInteraction", "interactionCreate", false);
  }

  async execute(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === "application") {
      const age = interaction.fields
        .getTextInputValue("age")
        .toLocaleLowerCase();
      const minecraftUsername =
        interaction.fields.getTextInputValue("minecraft-username");
      const ingameVoice = interaction.fields
        .getTextInputValue("ingame-voice")
        .toLocaleLowerCase();
      const joinReason = interaction.fields.getTextInputValue("join-reason");
      const favouriteWood =
        interaction.fields.getTextInputValue("favourite-wood");

      if (!interaction.member) {
        interaction.reply({
          embeds: [
            errorEmbed(
              "",
              "Member information is missing. Please rejoin the server."
            ),
          ],
        });
        return;
      }

      const logChannel = (await (
        interaction.member as GuildMember
      ).guild.channels.fetch(config.LOG_CHANNEL_ID)) as TextChannel;

      const acceptedValues = [
        "y",
        "yes",
        "yeah",
        "yep",
        "sure",
        "ok",
        "okay",
        "accept",
        "accepted",
        "true",
        "1",
        "positive",
      ];

      interaction.message?.delete();

      if (parseInt(age) < 15 && !acceptedValues.includes(age)) {
        interaction.reply({
          embeds: [
            errorEmbed("", "You must be 15 or older to join CrabCraft."),
          ],
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (Under 15)`,
        });
        return;
      }

      if (!acceptedValues.includes(ingameVoice)) {
        interaction.reply({
          embeds: [
            errorEmbed(
              "",
              "You must have a working microphone to join CrabCraft."
            ),
          ],
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (No microphone)`,
        });
        return;
      }

      if (!minecraftUsername.match(/^[a-zA-Z0-9_]{3,16}$/)) {
        interaction.reply({
          embeds: [
            errorEmbed("", "Please provide a valid Minecraft username."),
          ],
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (Invalid username: \`${minecraftUsername}\`)`,
        });
        return;
      }

      const usersUUID = (await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${minecraftUsername}`
      ).then((res) => res.json())) as Record<string, string>;

      if ("errorMessage" in usersUUID) {
        interaction.reply({
          embeds: [
            errorEmbed("", "Please provide a valid Minecraft username."),
          ],
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (Invalid username: \`${minecraftUsername}\`)`,
        });
        return;
      }

      const UUID = `${usersUUID["id"].slice(0, 8)}-${usersUUID["id"].slice(
        8,
        12
      )}-${usersUUID["id"].slice(12, 16)}-${usersUUID["id"].slice(
        16,
        20
      )}-${usersUUID["id"].slice(20)}`;

      const conn = await pool.getConnection();

      const rows = await conn.query(
        `SELECT * FROM discordsrv_accounts WHERE uuid = '${UUID}' OR discord = '${interaction.user.id}'`
      );

      if (rows.length > 0) {
        interaction.reply({
          embeds: [
            errorEmbed(
              "",
              "You have already submitted an application or are already a member of CrabCraft."
            ),
          ],
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (Already applied/member)`,
        });
        return;
      }

      const submittedApplicationEmbed = primaryEmbed(
        "Application Submitted",
        ""
      ).addFields([
        {
          name: "Minecraft Username",
          value: minecraftUsername,
        },
        {
          name: "Are you over the age of 15?",
          value: age,
        },
        {
          name: "Are you willing to speak in game?",
          value: ingameVoice,
        },
        {
          name: "Why do you want to join CrabCraft?",
          value: joinReason,
        },
        {
          name: "What is your favourite type of wood?",
          value: favouriteWood || "Not Specified",
        },
      ]);

      await interaction.reply({
        embeds: [submittedApplicationEmbed],
      });

      conn.query(
        `INSERT INTO discordsrv_accounts (uuid, discord) VALUES ('${UUID}', '${interaction.user.id}')`
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      (interaction.channel as TextChannel)?.send({
        embeds: [
          primaryEmbed(
            "Application Accepted",
            "Your application has been **accepted**!\n\n> **Check out the following channel to get started:** <#1308920422158569533>"
          )
            .setColor("Green")
            .addFields([
              {
                name: "Connection Information",
                value: `**Server IP:** \`cc.mxuk.me\`\n**Version:** \`1.21.3\``,
              },
            ]),
        ],
      });

      const memberRole = interaction.guild?.roles.cache.get(
        config.MEMBER_ROLE_ID
      );
      const member = interaction.guild?.members.cache.get(interaction.user.id);

      if (memberRole && member) {
        member.roles.add(memberRole);

        if (!logChannel) return;

        logChannel.send({
          content: `<:PlayerJoined:1251574077186113606> ${member.user} has been whitelisted. (\`${minecraftUsername}\`)`,
        });
      }

      sheet.setRow({
        minecraftUsername: minecraftUsername,
        minecraftUUID: UUID,
        discordUsername: interaction.user.username,
        discordID: interaction.user.id,
        over15: acceptedValues.includes(age) ? "TRUE" : "FALSE",
        voiceChat: acceptedValues.includes(ingameVoice) ? "TRUE" : "FALSE",
        active: "TRUE",
        joinReason: joinReason,
        favouriteWood: favouriteWood,
      });

      conn.end();

      return;
    }

    if (interaction.customId === "fast-application") {
      const minecraftUsername =
        interaction.fields.getTextInputValue("minecraft-username");

      if (!interaction.member) {
        interaction.reply({
          embeds: [
            errorEmbed(
              "",
              "Member information is missing. Please retry this action."
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const logChannel = (await (
        interaction.member as GuildMember
      ).guild.channels.fetch(config.LOG_CHANNEL_ID)) as TextChannel;

      if (!minecraftUsername.match(/^[a-zA-Z0-9_]{3,16}$/)) {
        interaction.reply({
          embeds: [
            errorEmbed("", "Please provide a valid Minecraft username."),
          ],
          ephemeral: true,
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (Invalid username: \`${minecraftUsername}\`)`,
        });
        return;
      }

      const usersUUID = (await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${minecraftUsername}`
      ).then((res) => res.json())) as Record<string, string>;

      if ("errorMessage" in usersUUID) {
        interaction.reply({
          embeds: [
            errorEmbed("", "Please provide a valid Minecraft username."),
          ],
          ephemeral: true,
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (Invalid username: \`${minecraftUsername}\`)`,
        });
        return;
      }

      const UUID = `${usersUUID["id"].slice(0, 8)}-${usersUUID["id"].slice(
        8,
        12
      )}-${usersUUID["id"].slice(12, 16)}-${usersUUID["id"].slice(
        16,
        20
      )}-${usersUUID["id"].slice(20)}`;

      const conn = await pool.getConnection();

      const rows = await conn.query(
        `SELECT * FROM discordsrv_accounts WHERE uuid = '${UUID}' OR discord = '${interaction.user.id}'`
      );

      if (rows.length > 0) {
        interaction.reply({
          embeds: [
            errorEmbed(
              "",
              "You have already submitted an application or are already a member of CrabCraft."
            ),
          ],
          ephemeral: true,
        });
        logChannel.send({
          content: `<:PlayerDeath:1251574756600316057> ${interaction.user} has been denied access to CrabCraft. (Already applied/member)`,
        });
        return;
      }

      const memberRole = interaction.guild?.roles.cache.get(
        config.MEMBER_ROLE_ID
      );

      if (memberRole) {
        const member = interaction.guild?.members.cache.get(
          interaction.user.id
        );
        member?.roles.add(memberRole);
      }

      await interaction.reply({
        embeds: [
          primaryEmbed(
            "Username Whitelisted",
            "Your username has been **whitelisted**!\n\n> **Check out the following channel to get started:** <#1308920422158569533>"
          ).setColor("Green"),
        ],
        ephemeral: true,
      });

      conn.query(
        `INSERT INTO discordsrv_accounts (uuid, discord) VALUES ('${UUID}', '${interaction.user.id}')`
      );

      logChannel.send({
        content: `<:PlayerJoined:1251574077186113606> ${interaction.user} has been whitelisted. (\`${minecraftUsername}\`)`,
      });

      sheet.setRow({
        minecraftUsername: minecraftUsername,
        minecraftUUID: UUID,
        discordUsername: interaction.user.username,
        discordID: interaction.user.id,
        over15: "TRUE",
        voiceChat: "TRUE",
        active: "TRUE",
        joinReason: "",
        favouriteWood: "",
      });

      conn.end();

      return;
    }
  }
}
