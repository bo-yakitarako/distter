CREATE TABLE users (
  user_id SERIAL NOT NULL,
  discord_id VARCHAR(255) NOT NULL,
  discord_user_name VARCHAR(255),
  discord_avatar_url VARCHAR(255),
  twitter_id VARCHAR(255) DEFAULT NULL,
  twitter_screen_name VARCHAR(255) DEFAULT NULL,
  twitter_user_name VARCHAR(255) DEFAULT NULL,
  twitter_avatar_url VARCHAR(255) DEFAULT NULL,
  encrypted_access_token VARCHAR(512) DEFAULT NULL,
  encrypted_access_token_secret VARCHAR(512) DEFAULT NULL,
  PRIMARY KEY (user_id),
  UNIQUE (discord_id)
);
