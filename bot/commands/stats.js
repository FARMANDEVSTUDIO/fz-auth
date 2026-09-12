const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show app statistics'),

  async execute(interaction) {
    const res = await callAdmin('stats');

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    const s = res.stats;
    const embed = new EmbedBuilder()
      .setTitle('App Statistics')
      .addFields(
        { name: 'Total Users', value: String(s.total_users), inline: true },
        { name: 'Active Users', value: String(s.active_users), inline: true },
        { name: 'Total Keys', value: String(s.total_keys), inline: true },
        { name: 'Unused Keys', value: String(s.unused_keys), inline: true },
        { name: 'Active Sessions', value: String(s.active_sessions), inline: true },
      )
      .setColor(0x5865f2)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
