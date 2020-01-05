import fs from 'fs';
import path from 'path';
import deepmerge from 'deepmerge';

const ENV_FILE_NAME = 'config.env.json';
const ENV_FILE_PATH =
  process.env.NODE_ENV === 'production' ? path.resolve(ENV_FILE_NAME) : path.resolve(__dirname, ENV_FILE_NAME);

export const defaultConfig = {
  port: 3908,
  logging: {
    enabled: false,
  },
  twitch: {
    clientId: '',
  },
};

let envConfig: Partial<typeof defaultConfig> = {};

if (fs.existsSync(ENV_FILE_PATH)) {
  envConfig = JSON.parse(fs.readFileSync(ENV_FILE_PATH, 'utf8'));
}

export const CONFIG = deepmerge(defaultConfig, envConfig);
