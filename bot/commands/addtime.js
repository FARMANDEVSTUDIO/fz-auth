const { SlashCommandBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addtime')
    .setDescription('Add subscription time to a user')
    .addStringOption(o => o.setName('username').setDescription('Username').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('e.g. 30d, 12h, 1y, lifetime').setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const duration = interaction.options.getString('duration');

    const res = await callAdmin('addtime', { username, duration });

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    return interaction.editReply({ content: `Added ${duration} to ${username}\nNew expiry: \`${res.expiry}\`` });
  },
};
