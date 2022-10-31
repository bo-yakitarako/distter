import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

client.on('ready', () => {
  console.log('はい最強のボット動き出しちゃった～お前もう終わり～');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) {
    return;
  }
  if (message.content === '!link') {
    await message.channel.send('こんちゃーす');
  }
});

client.login(TOKEN);
