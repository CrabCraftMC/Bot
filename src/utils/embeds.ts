import { EmbedBuilder, resolveColor, type ColorResolvable } from "discord.js";

export const primaryEmbed = (
  title: string,
  description: string,
  color: ColorResolvable = resolveColor("#f4887c")
) => {
  return new EmbedBuilder()
    .setTitle(title || null)
    .setDescription(description || null)
    .setColor(color);
};

export const errorEmbed = (
  title: string,
  description: string,
  color: ColorResolvable = "Red"
) => {
  return new EmbedBuilder()
    .setTitle(title || null)
    .setDescription(description || null)
    .setColor(color);
};
