const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`Done — commands registered to guild ${GUILD_ID} (instant)`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('Done — commands registered globally (may take up to 1 hour to appear)');
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
    process.exit(1);
  }
})();
