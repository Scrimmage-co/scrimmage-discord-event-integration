export interface DotEnvConfiguration {
  DISCORD_TOKEN: string;
  DISCORD_ALLOWED_CHANNEL_IDS: string[];
  DISCORD_ALLOWED_GUILD_IDS: string[];
  DISCORD_ALLOW_REGISTRATION: boolean;
  SCRIMMAGE_API_SERVER_ENDPOINT: string;
  SCRIMMAGE_PRIVATE_KEY: string;
  SCRIMMAGE_NAMESPACE: string;
  SCRIMMAGE_DATA_TYPE_PREFIX: string;
  HOSTNAME: string;
  PORT: number;
}

export const loadDotEnvConfiguration = (): DotEnvConfiguration => ({
  DISCORD_ALLOW_REGISTRATION: process.env.DISCORD_ALLOW_REGISTRATION === 'true',
  DISCORD_ALLOWED_CHANNEL_IDS: (process.env.DISCORD_ALLOWED_CHANNEL_IDS || '')
    .split(',')
    .filter(id => Boolean(id)),
  DISCORD_ALLOWED_GUILD_IDS: (process.env.DISCORD_ALLOWED_GUILD_IDS || '')
    .split(',')
    .filter(id => Boolean(id)),
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  SCRIMMAGE_API_SERVER_ENDPOINT: process.env.SCRIMMAGE_API_SERVER_ENDPOINT,
  SCRIMMAGE_DATA_TYPE_PREFIX: process.env.SCRIMMAGE_DATA_TYPE_PREFIX || '',
  SCRIMMAGE_NAMESPACE: process.env.SCRIMMAGE_NAMESPACE,
  SCRIMMAGE_PRIVATE_KEY: process.env.SCRIMMAGE_PRIVATE_KEY,
  HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
  PORT: Number(process.env.PORT) || 3000,
});
