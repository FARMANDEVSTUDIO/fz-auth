const { SlashCommandBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Blacklist an HWID or IP')
    .addStringOption(o => o.setName('type').setDescription('hwid or ip').setRequired(true).addChoices(
      { name: 'HWID', value: 'hwid' },
      { name: 'IP', value: 'ip' },
    ))
    .addStringOption(o => o.setName('value').setDescription('The HWID or IP to blacklist').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const value = interaction.options.getString('value');
    const reason = interaction.options.getString('reason');

    const res = await callAdmin('blacklist', { type, value, reason });

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    return interaction.editReply({ content: `${type.toUpperCase()} \`${value}\` blacklisted${reason ? ` (${reason})` : ''}` });
  },
};
