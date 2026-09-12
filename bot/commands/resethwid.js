const { SlashCommandBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resethwid')
    .setDescription('Reset HWID for a user')
    .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const res = await callAdmin('resethwid', { username });

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    return interaction.editReply({ content: `HWID reset for ${username}` });
  },
};
