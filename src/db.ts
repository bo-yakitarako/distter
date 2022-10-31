import { config } from 'dotenv';
import { Client } from 'pg';

config();

export async function query<T>(query: string) {
  const client = new Client({
    user: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    host: 'localhost',
    port: 5432,
    database: 'distter',
  });
  await client.connect();
  try {
    const result = await client.query(query);
    return result.rows as T[];
  } finally {
    await client.end();
  }
}
