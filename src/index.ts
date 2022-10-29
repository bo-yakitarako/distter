import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // eslint-disable-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename); // eslint-disable-line @typescript-eslint/naming-convention

const server = express();
server.use(express.urlencoded({ extended: true }));
server.use(express.json());

const router = express.Router();

server.use('/', express.static(`${__dirname}/../public`));

router.get('/', (req, res) => {
  res.render('../ejs/index.ejs');
});

server.use('/', router);

server.listen(3000, () => {
  console.log('サーバー起動しますわよ！');
});
