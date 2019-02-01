import { Injectable, OnModuleInit } from '@nestjs/common';
import { CONFIG } from '../../config/config';
/* tslint:disable:no-submodule-imports */
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as WebSocket from 'ws';
import { TChatEvent, IChatMessageData, TChatMessageEvent } from '../interface';
import { take, filter, map } from 'rxjs/operators';
import { CHAT_EVENT_TYPE } from '../const';
import { Observable } from 'rxjs';

@Injectable()
export class ChatConnectionService implements OnModuleInit {
  private chatConnection: WebSocketSubject<TChatEvent>;

  // TODO: delay  startup until connection done
  public onModuleInit() {
    return this.connect();
  }

  public connect(
  ) {
    this.chatConnection = webSocket<TChatEvent>({
      url: CONFIG.endpoints.chat,
      WebSocketCtor: WebSocket,
    });

    // TODO: remove after testing
    this.chatConnection.subscribe({
      next: event => console.log('> event', event),
      error: error => console.log('> error', error),
      complete: () => console.log('> completed'),
    });

    // TODO: (?) add reconnection or just kill process

    return this.chatConnection.pipe(
      take(1),
    );
  }

  public onMessage(): Observable<IChatMessageData> {
    return this.chatConnection.pipe(
      filter((event): event is TChatMessageEvent => event.type === CHAT_EVENT_TYPE.message),
      map(({ data }) => data),
    );
  }

  public joinChannel(channelId: number): void {
    this.sendEvent(CHAT_EVENT_TYPE.join, {
      channel_id: channelId
    });
  }

  private sendEvent<T extends CHAT_EVENT_TYPE, TData>(type: T, data: TData): void {
    // TODO: fix any
    this.chatConnection.next({ type, data } as any);
  }
}
