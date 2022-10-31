import crypto from 'crypto';
import { config } from 'dotenv';

config();

const algorithm = 'aes-256-cbc';
const salt = process.env.PG_USERNAME as string;
const password = process.env.PG_PASSWORD as string;

const inputEncoding = 'utf8';
const outputEncoding = 'hex';

export const encrypt = (text: string) => {
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const data = cipher.update(text, inputEncoding, outputEncoding);
  const final = cipher.final(outputEncoding);
  return `${data}${final}`;
};

export const decrypt = (text: string) => {
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(16);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const data = decipher.update(text, outputEncoding, inputEncoding);
  const final = decipher.final(inputEncoding);
  return `${data}${final}`;
};
