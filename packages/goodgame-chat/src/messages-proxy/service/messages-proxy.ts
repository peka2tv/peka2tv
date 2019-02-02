import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatConnectionService } from '../../chat-connection/service/chat-connection';
import { CHAT_EVENT_TYPE } from '../../chat-connection/const';
import { map, take, switchMapTo, switchMap, filter, catchError } from 'rxjs/operators';
import { IChatMessageData, IChatSuccessJoinData } from '../../chat-connection/interface';
import { AllHtmlEntities } from 'html-entities';
import { timer, throwError, race, of, Observable, merge, forkJoin } from 'rxjs';
import { GoodgameApiService } from '../../api/service/api';
import { IChannel } from '../interface';

const GOODGAME_CHANNEL_ID_FORMAT_REG_EXP = /^[0-9]+$/;
const CHANNEL_STATUS_REQUEST_TIMEOUT_MS = 5 * 1000;
const CHANNELS_LOAD_INTERVAL_MS = 2 * 60 * 1000;
const ENTITIES = new AllHtmlEntities();
const JOIN_TIMEOUT_MS = 5000;
const HTML_URLS_REG_EXP = new RegExp('(<a[^>]*href\="([^"]*)"[^>]*>[^<]*<\/a>)', 'ig');
const SMILES_PREFIX = 'gg-';
const SMILES_REG_EXP = new RegExp('(:[a-zA-Z0-9_]+:)', 'g');

@Injectable()
export class MessagesProxyService implements OnModuleInit {
  private connectedChannels: Record<string, IChannel> = {};

  constructor(
    private chatConnectionService: ChatConnectionService,
    private goodgameApiService: GoodgameApiService,
  ) {
  }

  public onModuleInit() {
    this.listenChannelsMessages();
    this.listenLeavedChannels();

    this.listenNewChannels();

  }

  private listenLeavedChannels() {
    // clean up leaved channels
    this.chatConnectionService.onEvent(CHAT_EVENT_TYPE.successLeave)
      .pipe(filter(data => !!this.connectedChannels[data.channel_id]))
      .subscribe(data => {
        this.removeChannel(data.channel_id);
      });
  }

  private listenNewChannels(): void {
    timer(0, CHANNELS_LOAD_INTERVAL_MS)
      .pipe(
        switchMap(() => this.loadActiveChannels()),
      )
      .subscribe(channels => this.processChannels(channels));
  }

  private processChannels(channels: IChannel[]): void {
console.log('> channels', channels);
    // join new online channels
    channels.forEach(channel => {
      if (this.connectedChannels[channel.ggChannelId]) {
        return;
      }

      this.joinChannel(channel);
    });

    // leave offline channels
    for (const channelId in this.connectedChannels) {
      if (!channels.find(channel => channel.ggChannelId === channelId)) {
        this.leaveChannel(channelId);
      }
    }
  }

  private joinChannel(channel: IChannel): void {
    const channelId = channel.ggChannelId;

    if (this.connectedChannels[channelId]) {
      return;
    }
console.log('> join', channelId);
    this.connectedChannels[channelId] = channel;

    this.chatConnectionService.joinChannel(channelId);

    const timeout$ = timer(JOIN_TIMEOUT_MS).pipe(
      switchMapTo<IChatSuccessJoinData>(throwError(null)),
    );

    race(
      timeout$,
      this.chatConnectionService.onEvent(CHAT_EVENT_TYPE.successJoin)
    )
      .pipe(
        map(data => data.channel_id === channelId),
        take(1),
      )
      .subscribe({
        // leave on error
        error: () => {
          this.leaveChannel(channelId);
        },
      });
  }

  private leaveChannel(channelId: string): void {
console.log('> leave', channelId);
    this.removeChannel(channelId);

    this.chatConnectionService.leaveChannel(channelId);
  }

  private removeChannel(channelId: string): void {
console.log('> remove channel', channelId);
    delete this.chatConnectionService[channelId];
  }

  private listenChannelsMessages(): void {
    this.chatConnectionService.onEvent(CHAT_EVENT_TYPE.message)
      .pipe(
        map(message => this.formatMessage(message)),
      )
      .subscribe(message => {
        console.log('> message', message.channel_id, message.message_id, message.text);
      });
  }

  private formatMessage(message: IChatMessageData): IChatMessageData {
    let text = message.text.replace(HTML_URLS_REG_EXP, '$2');

    text = ENTITIES.decode(text);

    text = text.replace(SMILES_REG_EXP, smile => ':' + SMILES_PREFIX + smile.slice(1));

    return { ...message, text };
  }

  private loadActiveChannels(): Observable<IChannel[]> {
    return this.loadActiveStreamsFromDb().pipe(
      switchMap(channels =>
        forkJoin(
          channels.map(channel => this.normalizeChannelId(channel))
        )
      ),
      map(channels=> channels.filter((channel): channel is IChannel => !!channel))
    );
  }

  private loadActiveStreamsFromDb(): Observable<IChannel[]> {
    return merge(
      of([
        { ggChannelId: '3857', streamerId: 123 },
        { ggChannelId: '26967', streamerId: 123 },
        { ggChannelId: 'primetime', streamerId: 123 },
      ]),
      timer(10000).pipe(
        map(() => [
          { ggChannelId: '16232', streamerId: 123 },
          { ggChannelId: '7692', streamerId: 123 },
          { ggChannelId: 'primetime', streamerId: 123 },
        ])
      ),
    );
  }

  private normalizeChannelId(channel: IChannel): Observable<IChannel | null> {
    if (channel.ggChannelId.match(GOODGAME_CHANNEL_ID_FORMAT_REG_EXP)) {
      return of(channel);
    }

    return this.getStreamIdFromChannelName(channel.ggChannelId).pipe(
      map(ggChannelId => ({ ...channel, ggChannelId })),
      catchError(() => of(null)),
    )
  }

  private getStreamIdFromChannelName(name: string): Observable<string> {
    return this.goodgameApiService.getChannelStatus(name, CHANNEL_STATUS_REQUEST_TIMEOUT_MS).pipe(
      map(data => data[Object.keys(data)[0]]),
      switchMap(stream =>
        stream
          ? of(stream.stream_id)
          : throwError(null)
      ),
    );
  }
}
