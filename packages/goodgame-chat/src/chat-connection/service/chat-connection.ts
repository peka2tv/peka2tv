import { Injectable, OnModuleInit } from '@nestjs/common';
import { CONFIG } from '../../config/config';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import WebSocket from 'ws';
import { TChatEvent, IChatEventMap, IChatEvent } from '../interface';
import { take, filter, map, delay, concatAll, tap } from 'rxjs/operators';
import { CHAT_EVENT_TYPE } from '../const';
import { Observable, Subject, of } from 'rxjs';
import { LoggerService } from '../../shared/service/logger';

const REQUEST_SPAM_TIMEOUT_MS = 100;

@Injectable()
export class ChatConnectionService implements OnModuleInit {
  private chatConnection: WebSocketSubject<TChatEvent<keyof IChatEventMap>>;
  private requestsQueue = new Subject<IChatEvent<any, any>>();

  constructor(
    private loggerService: LoggerService,
  ) {
  }

  // TODO: delay  startup until connection done
  public onModuleInit() {
    return this.connect();
  }

  public connect(
  ) {
    this.chatConnection = webSocket<TChatEvent<keyof IChatEventMap>>({
      url: CONFIG.endpoints.chat,
      WebSocketCtor: WebSocket,
    });

    this.chatConnection.subscribe({
      next: event => {
        if (
          CONFIG.logging.ggChatAllEvents
          || (CONFIG.logging.ggChatMainEvents && (event.type === CHAT_EVENT_TYPE.welcome))
          || (event.type === CHAT_EVENT_TYPE.error)
        ) {
          this.log(`event ${JSON.stringify(event)}`, true);
        }
      },
      error: error => this.log(`error ${JSON.stringify(error)}`, CONFIG.logging.ggChatMainEvents),
      complete: () => this.log(`completed`, CONFIG.logging.ggChatMainEvents),
    });

    this.requestsQueue
      .pipe(
        map(request =>
          of(request).pipe(
            delay(REQUEST_SPAM_TIMEOUT_MS),
          ),
        ),
        concatAll(),
        tap(request => this.log(`request ${JSON.stringify(request)}`, CONFIG.logging.ggChatAllEvents)),
      )
      .subscribe(request => this.chatConnection.next(request));

    return this.chatConnection.pipe(
      take(1),
    );
  }

  public onEvent<T extends keyof IChatEventMap>(type: T): Observable<IChatEventMap[T]> {
    return this.chatConnection.pipe(
      filter((event) => event.type === type),
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

  private log(message: string, enabled: boolean): void {
    if (!enabled) {
      return;
    }

    this.loggerService.log(message, this.constructor.name);
  }
}
