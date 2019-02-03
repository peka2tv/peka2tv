import { Injectable, OnModuleInit } from '@nestjs/common';
import { CONFIG } from '../../config/config';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import WebSocket from 'ws';
import { TChatEvent, IChatEventMap, IChatEvent } from '../interface';
import { take, filter, map, delay, concatAll, tap } from 'rxjs/operators';
import { CHAT_EVENT_TYPE } from '../const';
import { Observable, Subject, of } from 'rxjs';

const REQUEST_SPAM_TIMEOUT_MS = 100;

@Injectable()
export class ChatConnectionService implements OnModuleInit {
  private chatConnection: WebSocketSubject<TChatEvent<keyof IChatEventMap>>;
  private requestsQueue = new Subject<IChatEvent<any, any>>();

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

    // TODO: remove after testing
    this.chatConnection.subscribe({
      next: event => {
        if (event.type === CHAT_EVENT_TYPE.error) {
          console.log('> event', event);
        }
      },
      error: error => console.log('> error', error),
      complete: () => console.log('> completed'),
    });

    this.requestsQueue
      .pipe(
        map(request =>
          of(request).pipe(
            delay(REQUEST_SPAM_TIMEOUT_MS)
          )
        ),
        concatAll(),
        tap(request => console.log('> request', request)),
      )
      .subscribe(request => this.chatConnection.next(request));

    // TODO: (?) add reconnection or just kill process

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
      channel_id: channelId
    });
  }

  public leaveChannel(channelId: string): Observable<void> {
    return this.sendEvent(CHAT_EVENT_TYPE.leave, {
      channel_id: channelId
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
