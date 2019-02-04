export interface IChannel {
  ggChannelId: string;
  streamerIds: number[];
  joined: boolean;
}

export interface IStreamChannel {
  ggChannelId: string;
  streamerId: number;
}
