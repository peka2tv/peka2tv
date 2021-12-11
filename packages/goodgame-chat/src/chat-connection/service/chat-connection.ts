import { Injectable, OnModuleInit } from '@nestjs/common';
import { CONFIG } from '../../config/config';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import WebSocket from 'ws';
import { TChatEvent, IChatEventMap, IChatEvent } from '../interface';
import { take, filter, map, delay, concatAll, tap } from 'rxjs/operators';
import { CHAT_EVENT_TYPE } from '../const';
import { Observable, Subject, of } from 'rxjs';
import { BasicLogger } from '@peka2tv/libs/core/logger';

const REQUEST_SPAM_TIMEOUT_MS = 100;

@Injectable()
export class ChatConnectionService implements OnModuleInit {
  private chatConnection: WebSocketSubject<TChatEvent<keyof IChatEventMap>>;
  private requestsQueue = new Subject<IChatEvent<any, any>>();
  private logger = new BasicLogger(this.constructor.name, CONFIG.logging.enabled);

  // TODO: delay  startup until connection done
  public onModuleInit() {
    return this.connect();
  }

  public connect() {
    this.chatConnection = webSocket<TChatEvent<keyof IChatEventMap>>({
      url: CONFIG.endpoints.chat,
      WebSocketCtor: WebSocket,
    });

    this.chatConnection.subscribe({
      next: event => {
        if (
          CONFIG.logging.ggChatAllEvents ||
          (CONFIG.logging.ggChatMainEvents && event.type === CHAT_EVENT_TYPE.welcome) ||
          event.type === CHAT_EVENT_TYPE.error
        ) {
          this.logger.log(`event ${JSON.stringify(event)}`, true);
        }
      },
      error: error => this.logger.log(`error ${JSON.stringify(error)}`, CONFIG.logging.ggChatMainEvents),
      complete: () => this.logger.log(`completed`, CONFIG.logging.ggChatMainEvents),
    });

    this.requestsQueue
      .pipe(
        map(request => of(request).pipe(delay(REQUEST_SPAM_TIMEOUT_MS))),
        concatAll(),
        tap(request => this.logger.log(`request ${JSON.stringify(request)}`, CONFIG.logging.ggChatAllEvents)),
      )
      .subscribe(request => this.chatConnection.next(request));

    return this.chatConnection.pipe(take(1));
  }

  public onEvent<T extends keyof IChatEventMap>(type: T): Observable<IChatEventMap[T]> {
    return this.chatConnection.pipe(
      filter((event): event is TChatEvent<T> => event.type === type),
      map(({ data }) => data),
    );
  }

  public joinChannel(channelId: string): Observable<void> {
    return this.sendEvent(CHAT_EVENT_TYPE.join, {
      channel_id: channelId,
    });
  }

  public leaveChannel(channelId: string): Observable<void> {
    return this.sendEvent(CHAT_EVENT_TYPE.leave, {
      channel_id: channelId,
    });
  }

  private sendEvent<T extends keyof IChatEventMap>(type: T, data: IChatEventMap[T]): Observable<void> {
    return new Observable<void>(subscriber => {
      this.requestsQueue.next({ type, data });

      subscriber.next();
      subscriber.complete();
    });
  }
}
