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

type UserColumn =
  | 'user_id'
  | 'discord_id'
  | 'discord_user_name'
  | 'discord_avatar_url'
  | 'twitter_id'
  | 'twitter_screen_name'
  | 'twitter_user_name'
  | 'twitter_avatar_url'
  | 'encrypted_access_token'
  | 'encrypted_access_token_secret';

type UserResult = { [key in UserColumn]: string };

export const select = async (
  discord_id: string | undefined,
  columns: UserColumn[] = [],
) => {
  const selectColumns = columns.length === 0 ? '*' : columns.join(', ');
  const queryString = `SELECT ${selectColumns} FROM users WHERE discord_id = '${discord_id}'`;
  try {
    const result = await query<UserResult>(queryString);
    if (result.length === 0) {
      return null;
    }
    return result[0];
  } catch {
    return null;
  }
};
