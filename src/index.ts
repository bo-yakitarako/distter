import express from 'express';

const server = express();
server.use(express.urlencoded({ extended: true }));
server.use(express.json());

const router = express.Router();

server.use('/', express.static(`${__dirname}/../public`));

router.get('/', (req, res) => {
  res.render('../ejs/index.ejs');
});

router.get('/linked', (req, res) => {
  res.render('../ejs/linked.ejs');
});

server.use('/', router);

server.listen(3000, () => {
  console.log('サーバー起動しますわよ！');
});
