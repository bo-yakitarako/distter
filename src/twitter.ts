import { config } from 'dotenv';
import { Request, Response } from 'express';
import { LoginResult, TwitterApi } from 'twitter-api-v2';
import { hasDiscaordId } from './bot';
import { query } from './db';
import { encrypt } from './encrypt';

config();

declare module 'express-session' {
  interface SessionData {
    oauth_token_secret: string;
    discord_id: string;
  }
}

const appKey = process.env.TWITTER_API_KEY as string;
const appSecret = process.env.TWITTER_API_KEY_SECRET as string;
const domain = process.env.DOMAIN as string;
const client = new TwitterApi({ appKey, appSecret });

type Auth = { discord_id: string };

export const auth = async (
  req: Request<any, any, any, Auth, Auth>, // eslint-disable-line @typescript-eslint/no-explicit-any
  res: Response,
) => {
  const authLink = await client.generateAuthLink(`http://${domain}/callback`, {
    linkMode: 'authorize',
  });
  const { discord_id } = req.query;
  if (!discord_id) {
    res.redirect('/');
    return;
  }
  req.session.oauth_token_secret = authLink.oauth_token_secret;
  req.session.discord_id = discord_id;
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

  if (!oauth_token || !oauth_verifier || !oauth_token_secret || !existed) {
    res.redirect('/');
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
    res.send('失敗しちゃったっ☆てへっ');
    console.log(e);
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
