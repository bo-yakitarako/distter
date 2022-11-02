import express from 'express';
import session from 'express-session';
import md5 from 'md5';
import './bot';
import { select } from './db';
import { discordCallback } from './discord';
import { auth, callback } from './twitter';

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
    res.redirect('/');
    return;
  }
  res.render('../ejs/linked.ejs', data);
});

server.use('/', router);
server.use('/auth', auth);
server.use('/callback', callback);
server.use('/discord_callback', discordCallback);

server.listen(3000, () => {
  console.log('サーバー起動しますわよ！');
});
