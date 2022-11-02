import { config } from 'dotenv';
import express from 'express';
import session from 'express-session';
import md5 from 'md5';
import './bot';
import { select } from './db';
import { discordCallback } from './discord';
import { auth, callback } from './twitter';

config();
const oauthUrl = process.env.DISCORT_OAUTH_URL as string;
const PORT = process.env.PORT ?? '3000';

const server = express();
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.set('veiw engine', 'ejs');
server.use(
  session({
    secret: md5(Math.random().toString()),
    name: 'session',
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

const router = express.Router();

server.use('/', express.static(`${__dirname}/../public`));

router.get('/', (req, res) => {
  res.render('../ejs/index.ejs');
});

router.get('/linked', async (req, res) => {
  const { discord_id } = req.session;
  const data = await select(discord_id, [
    'discord_avatar_url',
    'twitter_avatar_url',
  ]);
  if (data === null) {
    res.redirect('/error/linked/no_user');
    return;
  }
  res.render('../ejs/linked.ejs', data);
});

const errorPage = (path: string, error_message: string) => {
  router.get(path, async (req, res) => {
    res.render('../ejs/error.ejs', { error_message, oauthUrl });
  });
};

errorPage('/error', '不明なエラー。。。ようわからんぽよ。。。');
errorPage(
  '/error/linked/no_discord_link',
  'まずはDiscordで!linkをやってみて。。。',
);
errorPage(
  '/error/linked/twitter_reject',
  'Twitter認証だめぽい。。。もっかい認証して。。。',
);
errorPage(
  '/error/linked/no_user',
  '誰だかわからんぽよ。。。もっかい認証して。。。',
);

server.use('/', router);
server.use('/auth', auth);
server.use('/callback', callback);
server.use('/discord_callback', discordCallback);

server.use((req, res) => {
  const error_message = '404 Not Foundってやつです。。。';
  res.status(404).render('../ejs/error.ejs', { error_message, oauthUrl });
});

server.listen(PORT, () => {
  console.log('サーバー起動しますわよ！');
});
