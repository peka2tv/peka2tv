export interface IPeka2tvChatUser {
  id: number;
  name: string;
}

export interface IPeka2tvChatNewMessage {
  type: 'message';
  time: number;
  channel: string;
  from: IPeka2tvChatUser;
  to: IPeka2tvChatUser | null;
  text: string;
}
