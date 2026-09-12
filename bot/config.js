require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
  LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID,
  API_URL: process.env.API_URL || 'http://localhost:3001',
  APP_ID: process.env.APP_ID,
  ADMIN_KEY: process.env.ADMIN_KEY,
  MASTER_KEY: process.env.MASTER_KEY,
  BOT_OWNER_ID: process.env.BOT_OWNER_ID,
};
