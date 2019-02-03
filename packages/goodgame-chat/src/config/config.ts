import fs from 'fs';
import path from 'path';

const ENV_FILE_NAME = 'config.env.json';
const ENV_FILE_PATH = process.env.NODE_ENV === 'production'
  ? path.resolve(ENV_FILE_NAME)
  : path.resolve(__dirname, ENV_FILE_NAME);

export const defaultConfig = {
  sdk: {
    host: '127.0.0.1',
    port: 3812,
  },
  endpoints: {
    chat: 'wss://chat-1.goodgame.ru/chat2/',
    api: 'https://goodgame.ru/api',
  },
  db: {
    host: 'localhost',
    user: 'root',
    password: 'vagrant',
    database: 'sc2tv2'
  },
};

let envConfig: Partial<typeof defaultConfig> = {};

if (fs.existsSync(ENV_FILE_PATH)) {
  /* tslint:disable:no-var-requires */
  envConfig = JSON.parse(
    fs.readFileSync(ENV_FILE_PATH, 'utf8')
  );
}

export const CONFIG = {
  ...defaultConfig,
  ...envConfig
};
