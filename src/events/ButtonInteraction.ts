import Event from "@/structures/Event";
import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export default class ChatInteractionEvent extends Event {
  constructor() {
    super("ButtonInteraction", "interactionCreate", false);
  }

  async execute(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;

    // I have no idea if bots can click buttons or not.. but this is here incase
    if (interaction.user.bot) return;

    if (interaction.customId == "apply") {
      const applicationModal = new ModalBuilder()
        .setCustomId("application")
        .setTitle("Season 4 Application");

      const age = new TextInputBuilder()
        .setCustomId("age")
        .setLabel("Are you 15 or older?")
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
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          minecraftUsername
        );

      const secondActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(ingameVoice);

      const thirdActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(joinReason);

      const fourthActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(favouriteWood);

      const fifthActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(age);

      applicationModal.addComponents(
        fifthActionRow,
        firstActionRow,
        secondActionRow,
        thirdActionRow,
        fourthActionRow
      );

      await interaction.showModal(applicationModal);
    }

    if (interaction.customId == "fast-apply") {
    }
  }
}
