const { SlashCommandBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user')
    .addStringOption(o => o.setName('username').setDescription('Username to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Ban reason')),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');

    const res = await callAdmin('ban', { username, reason });

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    return interaction.editReply({ content: `${username} banned${reason ? ` (${reason})` : ''}` });
  },
};
