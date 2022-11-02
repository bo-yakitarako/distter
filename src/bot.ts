import { APIEmbed, Client, GatewayIntentBits, Message } from 'discord.js';
import { config } from 'dotenv';
import { query } from './db';
import { hasDiscaordId } from './discord';
import { tweet } from './twitter';

config();

const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
const DISCORT_OAUTH_URL = process.env.DISCORT_OAUTH_URL as string;

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
  if (message.content === '!share') {
    await share(message);
  }
});

client.login(TOKEN);

const color = 0x94c2ff;

const createLink = async (message: Message) => {
  const existedDiscordId = await hasDiscaordId(message.author.id);
  const user = message.author;
  if (existedDiscordId) {
    const description = `認証リンク貼っとくね\n[認証リンク](${DISCORT_OAUTH_URL})`;
    const embed: APIEmbed = {
      title: 'もっかい認証すんのかな？',
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
  const description = `下のリンクからアカウントの認証をしてほしいんじゃな～\ndiscordの認証したら続けてTwitterの認証もしてね\n[認証リンク](${DISCORT_OAUTH_URL})`;
  const embed: APIEmbed = {
    title: 'アカウント認証してほしいんじゃぁ～',
    description,
    thumbnail: {
      url: user.displayAvatarURL(),
    },
    color,
  };
  await message.channel.send({ embeds: [embed] });
};

const share = async (message: Message) => {
  const text = await extractText(message);
  let title = 'ツイートしたよ！';
  if (!text) {
    title = 'チャット履歴少し遡ったけど、ツイートするものがないっぽいよ';
  } else {
    try {
      await tweet(message.author.id, text.substring(0, 140));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      switch (e.message) {
        case '誰もいねえよバカ':
          title = 'Twitter連携してからにしましょ';
          break;
        default:
          title = 'よくわかんないけどツイートできなかったよ！';
          break;
      }
      console.log(e);
    }
  }
  const embed: APIEmbed = {
    title,
    color,
  };
  await message.channel.send({ embeds: [embed] });
};

const extractText = async (message: Message) => {
  const messages = (
    await message.channel.messages.fetch({ limit: 10 })
  ).toJSON();
  let text = '';
  for (const m of messages) {
    if (m.content.startsWith('!') || m.author.id !== message.author.id) {
      continue;
    }
    text = m.content;
    break;
  }
  return text;
};
