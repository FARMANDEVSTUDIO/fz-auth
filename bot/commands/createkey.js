const { SlashCommandBuilder } = require('discord.js');
const { callAdmin } = require('../api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createkey')
    .setDescription('Generate license keys')
    .addStringOption(o => o.setName('duration').setDescription('e.g. 30d, 12h, 1y, lifetime').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Number of keys (1-100)').setMinValue(1).setMaxValue(100))
    .addIntegerOption(o => o.setName('level').setDescription('Key level (default 1)').setMinValue(1))
    .addStringOption(o => o.setName('prefix').setDescription('Key prefix (e.g. FZ)')),

  async execute(interaction) {
    const duration = interaction.options.getString('duration');
    const amount = interaction.options.getInteger('amount') || 1;
    const level = interaction.options.getInteger('level') || 1;
    const prefix = interaction.options.getString('prefix') || '';

    const res = await callAdmin('keys', { duration, amount, level, prefix });

    if (!res.success) {
      return interaction.editReply({ content: `Error: ${res.message}`, ephemeral: true });
    }

    const keyList = res.keys.join('\n');
    const msg = `**${res.keys.length} key(s) created** | Duration: \`${res.duration}\` | Level: ${level}\n\`\`\`\n${keyList}\n\`\`\``;

    return interaction.editReply({ content: msg, ephemeral: true });
  },
};
