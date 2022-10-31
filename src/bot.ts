import { APIEmbed, Client, GatewayIntentBits, Message } from 'discord.js';
import { config } from 'dotenv';
import { query } from './db';

config();

const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
const domain = process.env.DOMAIN as string;
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
    await createLink(message);
  }
});

client.login(TOKEN);

const color = 0x94c2ff;

export const hasDiscaordId = async (discordId: string) => {
  const queryStr = `SELECT discord_id FROM users WHERE discord_id = '${discordId}'`;
  const result = await query<{ discord_id: string }>(queryStr);
  return result.length > 0;
};

const createLink = async (message: Message) => {
  const existedDiscordId = await hasDiscaordId(message.author.id);
  const user = message.author;
  const linkURL = `http://${domain}/auth?discord_id=${user.id}`;
  if (existedDiscordId) {
    const description = `一応Twitterのほうのリンク貼っとくね\n[Twitter認証リンク](${linkURL})`;
    const embed: APIEmbed = {
      title: 'discordアカウントはもう僕には分かってるんだ',
      description,
      thumbnail: {
        url: user.displayAvatarURL(),
      },
      color,
    };
    await message.channel.send({ embeds: [embed] });
    return;
  }
  const insertData = [user.id, user.username, user.displayAvatarURL()]
    .map((v) => `'${v}'`)
    .join(',');
  const insertQuery = `INSERT INTO users (discord_id, discord_user_name, discord_avatar_url) VALUES (${insertData})`;
  await query(insertQuery);
  const description = `下のリンクからTwitterアカウントの認証をしてほしいんじゃな～\n[Twitter認証リンク](${linkURL})`;
  const embed: APIEmbed = {
    title: 'discordアカウントは分かったぜ！',
    description,
    thumbnail: {
      url: user.displayAvatarURL(),
    },
    color,
  };
  await message.channel.send({ embeds: [embed] });
};
