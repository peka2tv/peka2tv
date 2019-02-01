import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatConnectionService } from '../../chat-connection/service/chat-connection';
import { CHAT_EVENT_TYPE } from '../../chat-connection/const';
import { map, take, switchMapTo, switchMap } from 'rxjs/operators';
import { IChatMessageData, IChatSuccessJoinData } from '../../chat-connection/interface';
import { AllHtmlEntities } from 'html-entities';
import { timer, throwError, race, of, Observable, merge } from 'rxjs';

const CHANNELS_LOAD_INTERVAL_MS = 2 * 60 * 1000;
const ENTITIES = new AllHtmlEntities();
const JOIN_TIMEOUT_MS = 5000;
const HTML_URLS_REG_EXP = new RegExp('(<a[^>]*href\="([^"]*)"[^>]*>[^<]*<\/a>)', 'ig');
const SMILES_PREFIX = 'gg-';
const SMILES_REG_EXP = new RegExp('(:[a-zA-Z0-9_]+:)', 'g');

@Injectable()
export class MessagesProxyService implements OnModuleInit {
  private connectedChannels: Record<string, {}> = {};

  constructor(
    private chatConnectionService: ChatConnectionService,
  ) {
  }

  public onModuleInit() {
    this.listenChannelsMessages();

    // TODO: streamers-gg_channels map
    // TODO: (?) messages duplicates
    // TODO: build single executable with packed node
    // TODO: add docker Makefile
    // TODO: sending message to SDK
    // TODO: load active channels from db
    // TODO: test on production ^^

    timer(0, CHANNELS_LOAD_INTERVAL_MS)
      .pipe(
        switchMap(() => this.loadActiveChannels()),
      )
      .subscribe(channels => this.processChannels(channels));
  }

  private loadActiveChannels(): Observable<string[]> {
    return merge(
      of([
        '3857',
        '26967',
        '8406',
      ]),
      timer(10000).pipe(
        map(() => [
          '16232',
          '7692',
          '8406',
        ])
      ),
    );
  }

  private processChannels(channels: string[]): void {
console.log('> channels', channels);
    // join new online channels
    channels.forEach(channelId => {
      if (this.connectedChannels[channelId]) {
        return;
      }

      this.joinChannel(channelId);
    });

    // leave offline channels
    for (const channelId in this.connectedChannels) {
      if (channels.indexOf(channelId) === -1 ) {
        this.leaveChannel(channelId);
      }
    }
  }

  private joinChannel(channelId: string): void {
    if (this.connectedChannels[channelId]) {
      return;
    }
console.log('> join', channelId);
    this.connectedChannels[channelId] = {};

    this.chatConnectionService.joinChannel(channelId);

    const timeout$ = timer(JOIN_TIMEOUT_MS).pipe(
      switchMapTo<IChatSuccessJoinData>(throwError(undefined)),
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
    this.chatConnectionService.leaveChannel(channelId);
console.log('> leave', channelId);
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
}
