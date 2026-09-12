const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord to your FZ KeyAuth account')
    .addStringOption(o => o.setName('code').setDescription('Link code from the website').setRequired(true)),

  skipPermCheck: true,

  async execute(interaction) {
    const code = interaction.options.getString('code');
    const API_URL = config.API_URL || 'http://localhost:3000';

    const res = await fetch(`${API_URL}/api/admin/link-complete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-master-key': config.MASTER_KEY || process.env.MASTER_KEY || '',
      },
      body: JSON.stringify({ code, discord_id: interaction.user.id }),
    });
    const data = await res.json();

    if (!data.success) {
      return interaction.editReply({ content: `Failed: ${data.message}` });
    }

    return interaction.editReply({
      content: `Discord linked successfully! Your bot commands will now use your website role.`,
    });
  },
};
