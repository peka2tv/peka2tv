import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatConnectionService } from '../../chat-connection/service/chat-connection';
import { CHAT_EVENT_TYPE } from '../../chat-connection/const';
import { map, take, switchMap, filter, catchError, retry } from 'rxjs/operators';
import { IChatMessageData } from '../../chat-connection/interface';
import { AllHtmlEntities } from 'html-entities';
import { timer, throwError, of, Observable, forkJoin, interval } from 'rxjs';
import { GoodgameApiService } from '../../api/service/api';
import { IChannel, IStreamChannel } from '../interface';
import { CONFIG } from '../../config/config';
import { DbService } from '@peka2tv/libs/db';
import { BasicLogger } from '@peka2tv/libs/core/logger';
import { Peka2tvChatSdkService, IPeka2tvChatNewMessage } from '@peka2tv/libs/peka2tv-chat-sdk';

const CHANNEL_STATUS_REQUEST_TIMEOUT_MS = 5 * 1000;
const CHANNELS_LOAD_INTERVAL_MS = 2 * 60 * 1000;
const ENTITIES = new AllHtmlEntities();
const HTML_URLS_REG_EXP = new RegExp('(<a[^>]*href\="([^"]*)"[^>]*>[^<]*<\/a>)', 'ig');
const GOODGAME_CHANNEL_ID_FORMAT_REG_EXP = /^[0-9]+$/;
const PEKA2TV_CHANNEL_PREFIX = 'goodgame.ru/';
const SMILES_PREFIX = 'gg-';
const SMILES_REG_EXP = new RegExp('(:[a-zA-Z0-9_]+:)', 'g');
const STATISTIC_LOGGING_INTERVAL_MS = 1 * 60 * 1000;
const STREAM_GOODGAME_PROVIDER = 'goodgame.ru';

const EMPTY_STATISTIC = {
  joinedChannels: 0,
  peka2tvMessageSent: 0,
};

@Injectable()
export class MessagesProxyService implements OnModuleInit {
  private connectedChannels: Record<string, IChannel> = {};
  private logger = new BasicLogger(this.constructor.name, CONFIG.logging.enabled);
  private statistic = EMPTY_STATISTIC;

  constructor(
    private chatConnectionService: ChatConnectionService,
    private goodgameApiService: GoodgameApiService,
    private dbService: DbService,
    private peka2tvChatSdkService: Peka2tvChatSdkService,
  ) {
  }

  public onModuleInit() {
    this.listenChannelsMessages();
    this.listenLeavedChannels();

    this.listenNewChannels();

    interval(STATISTIC_LOGGING_INTERVAL_MS)
      .subscribe(() => this.logStatistic());
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

  private processChannels(channels: IStreamChannel[]): void {
    channels.forEach(({ ggChannelId, streamerId }) => {
      this.addStreamerToChannel(ggChannelId, streamerId);
    });

    for (const ggChannelId in this.connectedChannels) {
      this.connectedChannels[ggChannelId].streamerIds.forEach(streamerId => {
        if (!channels.find(channel => channel.streamerId === streamerId)) {
          this.removeStreamerFromChannel(ggChannelId, streamerId);
        }
      });
    }
  }

  private addStreamerToChannel(ggChannelId: string, streamerId: number): void {
    let channel = this.connectedChannels[ggChannelId];

    if (!channel) {
      channel = { ggChannelId, streamerIds: [], joined: false };

      this.connectedChannels[ggChannelId] = channel;
    }

    if (channel.streamerIds.indexOf(streamerId) === -1) {
      this.logger.log(`add streamer ${streamerId} to gg channel ${ggChannelId}`, CONFIG.logging.ggChatMainEvents);

      channel.streamerIds.push(streamerId);
    }

    if (!channel.joined) {
      this.joinGgChannel(ggChannelId);
    }
  }

  private removeStreamerFromChannel(ggChannelId: string, streamerId: number): void {
    this.logger.log(`remove streamer ${streamerId} from gg channel ${ggChannelId}`, CONFIG.logging.ggChatMainEvents);

    const channel = this.connectedChannels[ggChannelId];

    if (!channel) {
      return;
    }

    channel.streamerIds = channel.streamerIds.filter(id => id !== streamerId);

    if (!channel.streamerIds.length) {
      this.leaveGgChannel(ggChannelId);
    }
  }

  private joinGgChannel(ggChannelId: string): void {
    const channel = this.connectedChannels[ggChannelId];

    if (channel && channel.joined) {
      return;
    }

    this.logger.log(`join gg channel ${ggChannelId}`, CONFIG.logging.ggChatMainEvents);

    channel.joined = true;

    const successJoin$ = this.chatConnectionService.onEvent(CHAT_EVENT_TYPE.successJoin).pipe(
      filter(data => data.channel_id.toString() === ggChannelId),
      take(1),
    );

    this.chatConnectionService.joinChannel(ggChannelId)
      .pipe(
        switchMap(() => successJoin$),
        retry(3),
      )
      .subscribe({
        next: () => this.logger.log(`joined gg channel ${ggChannelId}`, CONFIG.logging.ggChatMainEvents),
        // leave on join error
        error: () => {
          this.leaveGgChannel(ggChannelId);
        },
      });
  }

  private leaveGgChannel(channelId: string): void {
    this.logger.log(`leave gg channel ${channelId}`, CONFIG.logging.ggChatMainEvents);

    this.removeChannel(channelId);

    this.chatConnectionService.leaveChannel(channelId)
      .subscribe();
  }

  private removeChannel(channelId: string): void {
    this.logger.log(`remove gg channel ${channelId}`, CONFIG.logging.ggChatMainEvents);

    delete this.chatConnectionService[channelId];
  }

  private listenChannelsMessages(): void {
    this.chatConnectionService.onEvent(CHAT_EVENT_TYPE.message)
      .pipe(
        map(message => ({ message, channel: this.connectedChannels[message.channel_id] })),
        filter(({ channel }) => !!channel),
        map(({ message, channel }) =>
          channel.streamerIds.map(streamerId =>
            this.formatMessage(message, streamerId),
          ),
        ),
      )
      .subscribe(messages => {
        messages.forEach(message => this.peka2tvChatSdkService.send(message));

        this.statistic.peka2tvMessageSent += messages.length;
      });
  }

  private formatMessage(message: IChatMessageData, streamerId: number): IPeka2tvChatNewMessage {
    let text = message.text.replace(HTML_URLS_REG_EXP, '$2');

    text = ENTITIES.decode(text);

    text = text.replace(SMILES_REG_EXP, smile => ':' + SMILES_PREFIX + smile.slice(1));

    const peka2tvChatMessage: IPeka2tvChatNewMessage = {
      type: 'message',
      time: Date.now(),
      channel: `${PEKA2TV_CHANNEL_PREFIX}${streamerId}`,
      from: { id: 0, name: message.user_name },
      to: null,
      text,
    };

    return peka2tvChatMessage;
  }

  private loadActiveChannels(): Observable<IStreamChannel[]> {
    return this.loadActiveStreamsFromDb().pipe(
      switchMap(channels =>
        forkJoin(
          channels.map(channel => this.normalizeChannelId(channel)),
        ),
      ),
      map(channels => channels.filter((channel): channel is IStreamChannel => !!channel)),
    );
  }

  private loadActiveStreamsFromDb(): Observable<IStreamChannel[]> {
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

    return this.dbService.query<IStreamChannel[]>(query, data);
  }

  private normalizeChannelId(channel: IStreamChannel): Observable<IStreamChannel | null> {
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

  private logStatistic(): void {
    this.statistic.joinedChannels = Object.keys(this.connectedChannels)
      .filter(ggChannelId => this.connectedChannels[ggChannelId].joined)
      .length;

    this.logger.log(`statistic: ${JSON.stringify(this.statistic)}`, CONFIG.logging.ggChatMainEvents);

    this.statistic = { ...EMPTY_STATISTIC };
  }
}
