const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get details of a user')
    .addStringOption(o => o.setName('username').setDescription('Username to look up').setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const res = await callAdmin('userinfo', { username });

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    const u = res.user;
    const embed = new EmbedBuilder()
      .setTitle(`User: ${u.username}`)
      .addFields(
        { name: 'HWID', value: u.hwid || 'Not set', inline: true },
        { name: 'Expiry', value: u.expiry ? new Date(u.expiry).toLocaleString() : 'None', inline: true },
        { name: 'Banned', value: u.banned ? `Yes (${u.ban_reason || 'no reason'})` : 'No', inline: true },
        { name: 'Last Login', value: u.last_login ? new Date(u.last_login).toLocaleString() : 'Never', inline: true },
        { name: 'Last IP', value: u.last_ip || 'Unknown', inline: true },
        { name: 'Created', value: new Date(u.created_at).toLocaleString(), inline: true },
      )
      .setColor(u.banned ? 0xff0000 : 0x00ff00);

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
