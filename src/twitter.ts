import { config } from 'dotenv';
import { Request, Response } from 'express';
import { TwitterApi } from 'twitter-api-v2';

config();

declare module 'express-session' {
  interface SessionData {
    oauth_token_secret: string;
  }
}

const appKey = process.env.TWITTER_API_KEY as string;
const appSecret = process.env.TWITTER_API_KEY_SECRET as string;
const domain = process.env.DOMAIN as string;
const client = new TwitterApi({ appKey, appSecret });

export const auth = async (req: Request, res: Response) => {
  const authLink = await client.generateAuthLink(`http://${domain}/callback`, {
    linkMode: 'authorize',
  });
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
  const { oauth_token_secret } = req.session;
  /* eslint-enable @typescript-eslint/naming-convention */

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
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
    res.send(JSON.stringify(result));
  } catch {
    res.send('失敗しちゃったっ☆てへっ');
  }
};
