import { CHAT_EVENT_TYPE } from './const';

export interface IChatEvent<T extends CHAT_EVENT_TYPE, TData> {
  type: T;
  data: TData;
}

export interface IChatWelcomeData {
  protocolVersion: number;
}

export interface IChatErrorData {
  errorMsg: string;
  error_num: number;
  channel_id: number;
}

export interface IChatJoinData {
  channel_id: string;
  hidden?: boolean;
}

export interface IChatSuccessJoinData {
  channel_id: number;
}

export interface IChatLeaveData {
  channel_id: string;
}

export interface IChatSuccessLeaveData {
  channel_id: string;
}

export interface IChatMessageData {
  channel_id: string;
  message_id: number;
  user_id: number;
  user_name: string;
  timestamp: number;
  text: string;
}

export interface IChatEventMap {
  [CHAT_EVENT_TYPE.welcome]: IChatWelcomeData;
  [CHAT_EVENT_TYPE.error]: IChatErrorData;
  [CHAT_EVENT_TYPE.join]: IChatJoinData;
  [CHAT_EVENT_TYPE.successJoin]: IChatSuccessJoinData;
  [CHAT_EVENT_TYPE.leave]: IChatLeaveData;
  [CHAT_EVENT_TYPE.successLeave]: IChatSuccessLeaveData;
  [CHAT_EVENT_TYPE.message]: IChatMessageData;
}

export type TChatEvent<T extends keyof IChatEventMap> = IChatEvent<T, IChatEventMap[T]>;
