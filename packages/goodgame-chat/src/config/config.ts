import fs from 'fs';
import path from 'path';
import deepmerge from 'deepmerge';

const ENV_FILE_NAME = 'config.env.json';
const ENV_FILE_PATH =
  process.env.NODE_ENV === 'production' ? path.resolve(ENV_FILE_NAME) : path.resolve(__dirname, ENV_FILE_NAME);

export const defaultConfig = {
  port: 3900,
  sdk: {
    url: 'http://127.0.0.1:3812',
  },
  endpoints: {
    chat: 'wss://chat-1.goodgame.ru/chat2/',
    api: 'https://goodgame.ru/api',
  },
  db: {
    host: 'localhost',
    user: 'root',
    password: 'vagrant',
    database: 'sc2tv2',
    connectionLimit: 10,
  },
  logging: {
    enabled: true,
    ggChatAllEvents: false,
    ggChatMainEvents: true,
    peka2tvSdkAllEvents: false,
    peka2tvSdkMainEvents: true,
  },
};

let envConfig: Partial<typeof defaultConfig> = {};

if (fs.existsSync(ENV_FILE_PATH)) {
  /* tslint:disable:no-var-requires */
  envConfig = JSON.parse(fs.readFileSync(ENV_FILE_PATH, 'utf8'));
}

export const CONFIG = deepmerge(defaultConfig, envConfig);
