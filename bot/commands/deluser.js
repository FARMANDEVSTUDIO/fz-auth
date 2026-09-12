const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deluser')
    .setDescription('Delete a user (irreversible)')
    .addStringOption(o => o.setName('username').setDescription('Username to delete').setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('username');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`deluser_confirm:${username}`).setLabel('Confirm Delete').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('deluser_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );

    return interaction.editReply({
      content: `Are you sure you want to delete **${username}**? This cannot be undone.`,
      components: [row],
    });
  },

  async handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'deluser_cancel') {
      return interaction.update({ content: 'Cancelled.', components: [] });
    }

    if (customId.startsWith('deluser_confirm:')) {
      const username = customId.split(':')[1];
      const res = await callAdmin('deluser', { username });

      if (!res.success) {
        return interaction.update({ content: `Error: ${res.message}`, components: [] });
      }

      return interaction.update({ content: `${username} deleted.`, components: [] });
    }
  },
};
