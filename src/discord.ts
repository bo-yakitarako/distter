import { Request, Response } from 'express';
import { config } from 'dotenv';
import axios from 'axios';
import { query } from './db';

config();

const API_ENDPOINT = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET as string;
const DOMAIN = process.env.DOMAIN as string;
const uri_domain = DOMAIN.includes('.') ? DOMAIN : 'localhost';
const REDIRECT_URI = `http://${uri_domain}/discord_callback`;

type Callback = { code: string };

type AccessTokenData = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

export const discordCallback = async (
  req: Request<any, any, any, Callback>, // eslint-disable-line @typescript-eslint/no-explicit-any
  res: Response,
) => {
  try {
    const { code } = req.query;
    const params = `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}&scope=identify`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded', // eslint-disable-line @typescript-eslint/naming-convention
    };
    const { data: accessTokenData } = await axios.post<AccessTokenData>(
      `${API_ENDPOINT}/oauth2/token`,
      params,
      {
        headers,
      },
    );
    const { access_token, token_type } = accessTokenData;
    const { data: user } = await axios.get<{ id: string }>(
      `${API_ENDPOINT}/users/@me`,
      {
        headers: {
          authorization: `${token_type} ${access_token}`,
        },
      },
    );
    if (!(await hasDiscaordId(user.id))) {
      res.redirect('/');
      return;
    }
    req.session.discord_id = user.id;
    res.redirect('/auth');
  } catch (e) {
    console.error(e);
    res.redirect('/');
  }
};

export const hasDiscaordId = async (discordId: string) => {
  const queryStr = `SELECT discord_id FROM users WHERE discord_id = '${discordId}'`;
  const result = await query<{ discord_id: string }>(queryStr);
  return result.length > 0;
};
