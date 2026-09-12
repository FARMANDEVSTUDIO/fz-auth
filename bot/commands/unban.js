const { SlashCommandBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user')
    .addStringOption(o => o.setName('username').setDescription('Username to unban').setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const res = await callAdmin('unban', { username });

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    return interaction.editReply({ content: `${username} unbanned` });
  },
};
