import { config } from 'dotenv';
import { Request, Response } from 'express';
import { LoginResult, TwitterApi } from 'twitter-api-v2';
import { query } from './db';
import { hasDiscaordId } from './discord';
import { decrypt, encrypt } from './encrypt';

config();

declare module 'express-session' {
  interface SessionData {
    oauth_token_secret: string;
    discord_id: string;
  }
}

const appKey = process.env.TWITTER_API_KEY as string;
const appSecret = process.env.TWITTER_API_KEY_SECRET as string;
const origin = process.env.ORIGIN as string;
const client = new TwitterApi({ appKey, appSecret });

export const auth = async (req: Request, res: Response) => {
  const authLink = await client.generateAuthLink(`${origin}/callback`, {
    linkMode: 'authorize',
  });
  const { discord_id } = req.session;
  if (!discord_id) {
    res.redirect('/error/linked/no_user');
    return;
  }
  req.session.oauth_token_secret = authLink.oauth_token_secret;
  res.redirect(authLink.url);
};

type Callback = {
  oauth_token: string;
  oauth_verifier: string;
};

export const callback = async (
  req: Request<any, any, any, Callback, Callback>, // eslint-disable-line @typescript-eslint/no-explicit-any
  res: Response,
) => {
  /* eslint-disable @typescript-eslint/naming-convention */
  const { oauth_token, oauth_verifier } = req.query;
  const { oauth_token_secret, discord_id } = req.session;
  /* eslint-enable @typescript-eslint/naming-convention */

  const existed = discord_id ? await hasDiscaordId(discord_id) : false;
  if (!existed) {
    res.redirect('/error/linked/no_discord_link');
    return;
  }

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    res.redirect('/error/linked/twitter_reject');
    return;
  }

  const tmpClient = new TwitterApi({
    appKey,
    appSecret,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  try {
    const result = await tmpClient.login(oauth_verifier);
    await updateData(result, discord_id!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    res.redirect('/linked');
  } catch (e) {
    res.redirect('/error/linked/twitter_reject');
  }
};

const updateData = async (result: LoginResult, discordId: string) => {
  const { accessToken, accessSecret, screenName, userId, client } = result;
  const { profile_image_url_https, name } = await client.v1.verifyCredentials();
  const avatarUrl = profile_image_url_https.replace('_normal', '');
  const data = {
    twitter_id: userId,
    twitter_user_name: name,
    twitter_screen_name: screenName,
    twitter_avatar_url: avatarUrl,
    encrypted_access_token: encrypt(accessToken),
    encrypted_access_token_secret: encrypt(accessSecret),
  };
  const set = (Object.keys(data) as (keyof typeof data)[])
    .map((key) => `${key} = '${data[key]}'`)
    .join(',');
  await query(`UPDATE users SET ${set} WHERE discord_id = '${discordId}'`);
};

type AccessToken = {
  encrypted_access_token: string;
  encrypted_access_token_secret: string;
};
export const tweet = async (discordId: string, tweet: string) => {
  const queryString = `SELECT encrypted_access_token, encrypted_access_token_secret FROM users WHERE discord_id = '${discordId}'`;
  const result = await query<AccessToken>(queryString);
  if (result.length === 0) {
    throw new Error('誰もいねえよバカ');
  }
  const { encrypted_access_token, encrypted_access_token_secret } = result[0];
  const accessToken = decrypt(encrypted_access_token);
  const accessSecret = decrypt(encrypted_access_token_secret);
  const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });
  const { user, id_str, created_at } = await client.v1.tweet(tweet);
  const author = {
    name: `${user.name} (@${user.screen_name})`,
    url: `https://twitter.com/${user.screen_name}`,
    icon_url: user.profile_image_url_https,
  };
  const timestamp = new Date(created_at);
  const url = `https://twitter.com/${user.screen_name}/status/${id_str}`;
  return { author, url, timestamp };
};
