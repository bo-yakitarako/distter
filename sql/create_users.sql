CREATE TABLE users (
  user_id SERIAL NOT NULL,
  discord_id VARCHAR(255) NOT NULL,
  discord_user_name VARCHAR(255),
  discord_profile_image_url VARCHAR(255),
  twitter_id VARCHAR(255) NOT NULL,
  twitter_screen_name VARCHAR(255) NOT NULL,
  twitter_user_name VARCHAR(255),
  twitter_profile_image_url VARCHAR(255),
  encrypted_access_token VARCHAR(512),
  encrypted_access_token_secret VARCHAR(512),
  PRIMARY KEY (user_id),
  UNIQUE (discord_id)
);
