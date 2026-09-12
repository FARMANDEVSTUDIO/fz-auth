const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('users')
    .setDescription('List all users'),

  async execute(interaction) {
    const res = await callAdmin('users');

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    const list = res.users.slice(0, 20).map(u => {
      const status = u.banned ? '[BANNED]' : '';
      return `\`${u.username}\` ${status}`;
    }).join('\n') || 'No users';

    const embed = new EmbedBuilder()
      .setTitle(`Users (${res.count} total)`)
      .setDescription(list)
      .setColor(0x5865f2);

    if (res.count > 20) {
      embed.setFooter({ text: `Showing first 20 of ${res.count}` });
    }

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
