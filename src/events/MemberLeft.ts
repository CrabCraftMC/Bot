import Event from "@/structures/Event";
import config from "@/utils/config";
import Sheet from "@/utils/sheet";
import { TextChannel, type GuildMember } from "discord.js";

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
    super("MemberLeft", "guildMemberRemove", false);
  }

  async execute(member: GuildMember) {
    if (member.user.bot) return;

    const conn = await pool.getConnection();
    // check if user is in the database
    const rows = await conn.query(
      `SELECT * FROM discordsrv_accounts WHERE discord = '${member.id}'`
    );

    if (rows.length === 0) return;

    await conn.query(
      `DELETE FROM discordsrv_accounts WHERE discord = '${member.id}'`
    );

    const logChannel = (await member.guild.channels.fetch(
      config.LOG_CHANNEL_ID
    )) as TextChannel;

    if (!logChannel) return;

    const player = (await fetch(
      `https://sessionserver.mojang.com/session/minecraft/profile/${rows[0].uuid}`
    ).then((res) => res.json())) as Record<string, string>;

    logChannel.send({
      content: `<:PlayerLeft:1251574076061913179> ${member.user.tag} (<@!${member.user.id}>) left the server. Removed player \`${player["name"]}\` from the database.`,
    });

    sheet.inactiveUser(member.user.id);
  }
}
