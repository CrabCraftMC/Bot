import Discord, {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GatewayIntentBits,
  Interaction,
  ModalBuilder,
  PermissionFlagsBits,
  resolveColor,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { config } from "dotenv";
import rcon from "rcon-ts";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

config();

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const jwt = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, "\n"),
  scopes: SCOPES,
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt);

const Client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const Rcon = new rcon({
  host: process.env.RCON_HOST!,
  port: parseInt(process.env.RCON_PORT!),
  password: process.env.RCON_PASSWORD!,
});

Client.on("guildMemberAdd", async (member) => {
  const applicationChannel = (await member.guild.channels.create({
    name: `app-${member.user.username}`,
    parent: "1272878089495380104",
    permissionOverwrites: [
      {
        id: member.id,
        allow: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
    ],
  })) as TextChannel;

  const welcomeEmbed = new EmbedBuilder()
    .setTitle("Welcome to CrabCraft! 🦀")
    .setDescription(
      "Please fill out the application form by clicking the button below this message."
    )
    .setColor(resolveColor("Orange"));

  const applicationButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("application")
      .setLabel("Apply")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary)
  );

  applicationChannel.send({
    content: `<@${member.id}>`,
    embeds: [welcomeEmbed],
    components: [applicationButton],
  });
});

Client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId == "application") {
    const modal = new ModalBuilder()
      .setCustomId("application-modal")
      .setTitle("CrabCraft Application Form");

    const age = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Are you over the age of 15?")
      .setPlaceholder("Answer must be: Y/N")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const minecraftUsername = new TextInputBuilder()
      .setCustomId("minecraft-username")
      .setLabel("Minecraft Username")
      .setPlaceholder("Notch")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const ingameVoice = new TextInputBuilder()
      .setCustomId("ingame-voice")
      .setLabel("Are you willing to speak in game?")
      .setPlaceholder("Answer must be: Y/N")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const joinReason = new TextInputBuilder()
      .setCustomId("join-reason")
      .setLabel("Why do you want to join CrabCraft?")
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const favouriteWood = new TextInputBuilder()
      .setCustomId("favourite-wood")
      .setLabel("What is your favourite type of wood?")
      .setRequired(false)
      .setStyle(TextInputStyle.Short);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(minecraftUsername);

    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(ingameVoice);

    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(joinReason);

    const fourthActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(favouriteWood);

    const fifthActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(age);

    modal.addComponents(
      fifthActionRow,
      firstActionRow,
      secondActionRow,
      thirdActionRow,
      fourthActionRow
    );

    await interaction.showModal(modal);
  }

  if (interaction.customId == "season-3") {
    const modal = new ModalBuilder()
      .setCustomId("season-3-modal")
      .setTitle("Access Season 3");

    const minecraftUsername = new TextInputBuilder()
      .setCustomId("minecraft-username")
      .setLabel("Minecraft Username")
      .setPlaceholder("Notch")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(minecraftUsername);

    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }
});

Client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isModalSubmit()) return;

  const logChannel = interaction.guild?.channels.cache.get(
    process.env.LOG_CHANNEL_ID!
  ) as TextChannel;

  if (interaction.customId == "application-modal") {
    const age = interaction.fields.getTextInputValue("age").toLocaleLowerCase();
    const minecraftUsername =
      interaction.fields.getTextInputValue("minecraft-username");
    const ingameVoice = interaction.fields
      .getTextInputValue("ingame-voice")
      .toLocaleLowerCase();
    const joinReason = interaction.fields.getTextInputValue("join-reason");
    const favouriteWood =
      interaction.fields.getTextInputValue("favourite-wood");

    const acceptedAges = ["y", "yes", "yeah", "yep", "yea", "positive", "1"];
    const acceptedIngameVoice = [
      "y",
      "yes",
      "yeah",
      "yep",
      "yea",
      "positive",
      "1",
    ];

    if (!acceptedAges.includes(age)) {
      await interaction.message?.delete();
      logChannel.send(
        `${interaction.user.tag} tried to apply, but was under the age of 15!`
      );
      return await interaction.reply({
        content: "You must be over the age of 15 to apply.",
        ephemeral: false,
      });
    }

    if (!acceptedIngameVoice.includes(ingameVoice)) {
      await interaction.message?.delete();
      logChannel.send(
        `${interaction.user.tag} tried to apply, but was not willing to speak in game!`
      );
      return await interaction.reply({
        content: "You must be willing to speak in game to apply.",
        ephemeral: false,
      });
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(minecraftUsername)) {
      await interaction.message?.delete();
      logChannel.send(
        `${interaction.user.tag} tried to apply, but provided an invalid Minecraft username! (\`${minecraftUsername}\`)`
      );
      return await interaction.reply({
        content: "Invalid Minecraft username.",
        ephemeral: false,
      });
    }

    const applicationEmbed = new EmbedBuilder()
      .setTitle("CrabCraft Application Form")
      .addFields([
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
      ])
      .setColor(resolveColor("Orange"));

    await interaction.message?.delete();

    await interaction.reply({
      embeds: [applicationEmbed],
    });

    Rcon.session((c) => c.send(`whitelist add ${minecraftUsername}`)) // connects, sends, and then disconnects.
      .then(() => {
        const whitelistedEmbed = new EmbedBuilder()
          .setColor(resolveColor("Orange"))
          .setTitle("Username Whitelisted")
          .setDescription(
            `You have been successfully whitelisted.\n\nThe server's IP is \`cc.mxuk.me\`. (Releases: <t:1724612400:R>)\n> **Please ensure you have Simple Voice Chat installed!**`
          );
        logChannel.send(
          `**${interaction.user.tag} (${minecraftUsername}) has been whitelisted!**`
        );
        doc.loadInfo().then(async () => {
          const rows = await doc.sheetsByIndex[0].getRows();
          const matchingRow = rows.find(
            (_row_) => _row_.get("Minecraft Username") === ""
          );
          matchingRow?.set("Minecraft Username", minecraftUsername);
          matchingRow?.set("Discord Username", interaction.user.tag);
          matchingRow?.set("Discord ID", interaction.user.id);
          matchingRow?.set("Over 15?", "TRUE");
          matchingRow?.set("Voice Chat?", "TRUE");
          matchingRow?.set("Join Reason", joinReason);
          matchingRow?.set("Favourite Wood", favouriteWood);
          await matchingRow?.save();
        });
        interaction.channel?.send({ embeds: [whitelistedEmbed] });
      }, console.error);

    const memberRole = interaction.guild?.roles.cache.get(
      process.env.CC_ROLE_ID!
    );
    const member = interaction.guild?.members.cache.get(interaction.user.id);

    if (memberRole && member) {
      member.roles.add(memberRole);
    }
  }

  if (interaction.customId == "season-3-modal") {
    const minecraftUsername =
      interaction.fields.getTextInputValue("minecraft-username");

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(minecraftUsername)) {
      logChannel.send(
        `${interaction.user.tag} tried to apply, but provided an invalid Minecraft username! (\`${minecraftUsername}\`)`
      );
      return await interaction.reply({
        content: "Invalid Minecraft username.",
        ephemeral: true,
      });
    }

    Rcon.session((c) => c.send(`whitelist add ${minecraftUsername}`)) // connects, sends, and then disconnects.
      .then(() => {
        const whitelistedEmbed = new EmbedBuilder()
          .setColor(resolveColor("Orange"))
          .setTitle("Username Whitelisted")
          .setDescription(
            `You have been successfully whitelisted.\n\nThe server's IP is \`cc.mxuk.me\`. (Releases: <t:1724612400:R>)\n> **Please ensure you have Simple Voice Chat installed!**`
          );
        logChannel.send(
          `**${interaction.user.tag} (${minecraftUsername}) has been whitelisted!**`
        );
        doc.loadInfo().then(async () => {
          const rows = await doc.sheetsByIndex[0].getRows();
          const matchingRow = rows.find(
            (_row_) => _row_.get("Minecraft Username") === ""
          );
          matchingRow?.set("Minecraft Username", minecraftUsername);
          matchingRow?.set("Discord Username", interaction.user.tag);
          matchingRow?.set("Discord ID", interaction.user.id);
          matchingRow?.set("Over 15?", "TRUE");
          matchingRow?.set("Voice Chat?", "TRUE");
          await matchingRow?.save();
        });
        interaction.reply({ embeds: [whitelistedEmbed], ephemeral: true });
      }, console.error);

    const memberRole = interaction.guild?.roles.cache.get(
      process.env.CC_ROLE_ID!
    );
    const member = interaction.guild?.members.cache.get(interaction.user.id);

    if (memberRole && member) {
      member.roles.add(memberRole);
    }
  }
});

Client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.member?.user.username !== "immaxm") return;
  if (message.content == "please send the menu now sir bot") {
    const embed = new EmbedBuilder()
      .setColor(resolveColor("Orange"))
      .setTitle("Access Season 3")
      .setDescription(
        "Click the button below this message and type your Minecraft Username to get added to the Season 3 role."
      );

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("season-3")
        .setLabel("Season 3")
        .setEmoji("3️⃣")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({
      embeds: [embed],
      components: [button],
    });
  }
});

Client.on("ready", () => {
  console.log(`Logged in as ${Client.user?.tag}!`);
});

Client.login(process.env.TOKEN);

// Don't crash on error
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
