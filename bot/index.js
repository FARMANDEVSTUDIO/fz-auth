const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { callAdmin } = require('./api');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

const COMMAND_PERMS = {
  createkey: 'create_keys',
  users: 'view_users',
  userinfo: 'view_users',
  ban: 'ban_users',
  unban: 'ban_users',
  resethwid: 'reset_hwid',
  addtime: 'add_time',
  deluser: 'delete_users',
  blacklist: 'ban_users',
  stats: 'view_stats',
};

function isOwner(userId) {
  return config.BOT_OWNER_ID && userId === config.BOT_OWNER_ID;
}

function hasDiscordPermission(member) {
  if (isOwner(member.user.id)) return true;
  if (member.permissions.has('Administrator')) return true;
  if (config.ADMIN_ROLE_ID && member.roles.cache.has(config.ADMIN_ROLE_ID)) return true;
  return false;
}

async function checkWebsitePermission(discordId, requiredPerm) {
  try {
    const res = await callAdmin('member', { discord_id: discordId });
    if (!res.success) return null;
    return { role: res.role, allowed: !!res.permissions[requiredPerm] };
  } catch {
    return null;
  }
}

client.once('ready', () => {
  console.log(`Bot online: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await interaction.deferReply({ ephemeral: true });

      if (!command.skipPermCheck) {
        if (config.BOT_OWNER_ID && interaction.user.id !== config.BOT_OWNER_ID) {
          return interaction.editReply({ content: "Only the bot owner can use these commands." });
        }
        const requiredPerm = COMMAND_PERMS[interaction.commandName];
        const webPerm = await checkWebsitePermission(interaction.user.id, requiredPerm);

        if (webPerm) {
          if (!webPerm.allowed) {
            return interaction.editReply({
              content: `You don't have the **${requiredPerm}** permission. Ask your app owner to update your role on the FZ KeyAuth website.`,
            });
          }
        } else {
          if (!hasDiscordPermission(interaction.member)) {
            return interaction.editReply({
              content: "You don't have permission. Link your Discord on the FZ KeyAuth website or ask an admin.",
            });
          }
        }
      }

      await command.execute(interaction);
    } catch (err) {
      console.error(`Error in /${interaction.commandName}:`, err);
      try {
        await interaction.editReply({ content: 'Something went wrong.' });
      } catch { }
    }
  }

  if (interaction.isButton()) {
    const prefix = interaction.customId.split(':')[0].split('_')[0];
    const command = client.commands.get(`${prefix}`);

    if (!command) {
      const deluser = client.commands.get('deluser');
      if (deluser && deluser.handleButton) {
        try { await deluser.handleButton(interaction); } catch (err) { console.error(err); }
      }
      return;
    }

    if (command.handleButton) {
      try { await command.handleButton(interaction); } catch (err) { console.error(err); }
    }
  }
});

client.login(config.BOT_TOKEN);
