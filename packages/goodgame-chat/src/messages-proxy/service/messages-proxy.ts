import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatConnectionService } from '../../chat-connection/service/chat-connection';
import { CHAT_EVENT_TYPE } from '../../chat-connection/const';
import { map, take, switchMap, filter, catchError, retry } from 'rxjs/operators';
import { IChatMessageData } from '../../chat-connection/interface';
import { AllHtmlEntities } from 'html-entities';
import { timer, throwError, of, Observable, forkJoin } from 'rxjs';
import { GoodgameApiService } from '../../api/service/api';
import { IChannel } from '../interface';
import { DbService } from '../../db/service/db';
import { Peka2tvChatSdkService } from '../../peka2tv-chat-sdk/service/sdk';
import { IPeka2tvChatNewMessage } from '../../peka2tv-chat-sdk/interface';
import { LoggerService } from '../../shared/service/logger';
import { CONFIG } from '../../config/config';

const CHANNEL_STATUS_REQUEST_TIMEOUT_MS = 5 * 1000;
const CHANNELS_LOAD_INTERVAL_MS = 2 * 60 * 1000;
const ENTITIES = new AllHtmlEntities();
const HTML_URLS_REG_EXP = new RegExp('(<a[^>]*href\="([^"]*)"[^>]*>[^<]*<\/a>)', 'ig');
const GOODGAME_CHANNEL_ID_FORMAT_REG_EXP = /^[0-9]+$/;
const PEKA2TV_CHANNEL_PREFIX = 'goodgame.ru/';
const SMILES_PREFIX = 'gg-';
const SMILES_REG_EXP = new RegExp('(:[a-zA-Z0-9_]+:)', 'g');
const STREAM_GOODGAME_PROVIDER = 'goodgame.ru';

@Injectable()
export class MessagesProxyService implements OnModuleInit {
  private connectedChannels: Record<string, IChannel> = {};

  constructor(
    private chatConnectionService: ChatConnectionService,
    private goodgameApiService: GoodgameApiService,
    private dbService: DbService,
    private peka2tvChatSdkService: Peka2tvChatSdkService,
    private loggerService: LoggerService,
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

    this.log(`join ${channelId}`, CONFIG.logging.ggChatMainEvents);

    this.connectedChannels[channelId] = channel;

    const successJoin$ = this.chatConnectionService.onEvent(CHAT_EVENT_TYPE.successJoin).pipe(
      filter(data => data.channel_id.toString() === channelId),
      take(1),
    );

    this.chatConnectionService.joinChannel(channelId)
      .pipe(
        switchMap(() => successJoin$),
        retry(3),
      )
      .subscribe({
        next: () => this.log(`joined ${channelId}`, CONFIG.logging.ggChatMainEvents),
        // leave on error
        error: () => {
          this.leaveChannel(channelId);
        },
      });
  }

  private leaveChannel(channelId: string): void {
    this.log(`leave ${channelId}`, CONFIG.logging.ggChatMainEvents);

    this.removeChannel(channelId);

    this.chatConnectionService.leaveChannel(channelId)
      .subscribe();
  }

  private removeChannel(channelId: string): void {
    this.log(`remove channel ${channelId}`, CONFIG.logging.ggChatMainEvents);

    delete this.chatConnectionService[channelId];
  }

  private listenChannelsMessages(): void {
    this.chatConnectionService.onEvent(CHAT_EVENT_TYPE.message)
      .pipe(
        filter(message => !!this.connectedChannels[message.channel_id]),
        map(message => this.formatMessage(message)),
      )
      .subscribe(message => this.peka2tvChatSdkService.send(message));
  }

  private formatMessage(message: IChatMessageData): IPeka2tvChatNewMessage {
    let text = message.text.replace(HTML_URLS_REG_EXP, '$2');

    text = ENTITIES.decode(text);

    text = text.replace(SMILES_REG_EXP, smile => ':' + SMILES_PREFIX + smile.slice(1));

    const channel = this.connectedChannels[message.channel_id];

    const peka2tvChatMessage: IPeka2tvChatNewMessage = {
      type: 'message',
      time: Date.now(),
      channel: `${PEKA2TV_CHANNEL_PREFIX}${channel.streamerId}`,
      from: { id: 0, name: message.user_name },
      to: null,
      text,
    };

    return peka2tvChatMessage;
  }

  private loadActiveChannels(): Observable<IChannel[]> {
    return this.loadActiveStreamsFromDb().pipe(
      switchMap(channels =>
        forkJoin(
          channels.map(channel => this.normalizeChannelId(channel)),
        ),
      ),
      map(channels => channels.filter((channel): channel is IChannel => !!channel)),
    );
  }

  private loadActiveStreamsFromDb(): Observable<IChannel[]> {
    const query = `
      SELECT
        stream_player.channel AS ggChannelId, stream.user_id AS streamerId
      FROM
        stream_player
        JOIN stream ON stream.user_id = stream_player.user_id
      WHERE
        stream.active = 1
        AND stream_player.active = 1
        AND stream_player.provider = ?
    `;

    const data = [
      STREAM_GOODGAME_PROVIDER,
    ];

    return this.dbService.query<IChannel[]>(query, data);
  }

  private normalizeChannelId(channel: IChannel): Observable<IChannel | null> {
    if (channel.ggChannelId.match(GOODGAME_CHANNEL_ID_FORMAT_REG_EXP)) {
      return of(channel);
    }

    return this.getStreamIdFromChannelName(channel.ggChannelId).pipe(
      map(ggChannelId => ({ ...channel, ggChannelId })),
      catchError(() => of(null)),
    );
  }

  private getStreamIdFromChannelName(name: string): Observable<string> {
    return this.goodgameApiService.getChannelStatus(name, CHANNEL_STATUS_REQUEST_TIMEOUT_MS).pipe(
      map(data => data[Object.keys(data)[0]]),
      switchMap(stream =>
        stream
          ? of(stream.stream_id)
          : throwError(null),
      ),
    );
  }

  private log(message: string, enabled: boolean): void {
    if (!enabled) {
      return;
    }

    this.loggerService.log(message, this.constructor.name);
  }
}
