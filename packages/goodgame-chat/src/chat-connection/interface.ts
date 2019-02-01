import { CHAT_EVENT_TYPE } from './const';

export interface IChatEvent<T extends CHAT_EVENT_TYPE, TData> {
  type: T;
  data: TData;
}

export interface IChatWelcomeData {
  protocolVersion: number;
}

export type TChatWelcomeEvent = IChatEvent<CHAT_EVENT_TYPE.welcome, IChatWelcomeData>;

export interface IChatJoinData {
  channel_id: number;
  hidden?: boolean;
}

export type TChatJoinEvent = IChatEvent<CHAT_EVENT_TYPE.join, IChatJoinData>;

export interface IChatMessageData {
  channel_id: string;
  user_id: number;
  user_name: string;
  user_rights: number;
  premium: number;
  premiums: string[];
  resubs: Record<string, number>;
  staff: number;
  color: string;
  icon: string;
  mobile: number;
  payments: number;
  paymentsAll: Record<string, number>;
  isStatus: number;
  message_id: number;
  timestamp: number;
  text: string;
}

export type TChatMessageEvent = IChatEvent<CHAT_EVENT_TYPE.message, IChatMessageData>;

export type TChatEvent =
  | TChatWelcomeEvent
  | TChatJoinEvent
  | TChatMessageEvent;
