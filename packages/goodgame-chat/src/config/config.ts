import { ENV_CONFIG } from './config.env';

export const DEFAULT_CONFIG = {
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

export const CONFIG = {
  ...DEFAULT_CONFIG,
  ...ENV_CONFIG
};
