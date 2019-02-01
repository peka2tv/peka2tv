import { Injectable, OnModuleInit } from '@nestjs/common';
import { CONFIG } from '../../config/config';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as WebSocket from 'ws';
import { TChatEvent, IChatEventMap } from '../interface';
import { take, filter, map } from 'rxjs/operators';
import { CHAT_EVENT_TYPE } from '../const';
import { Observable } from 'rxjs';

@Injectable()
export class ChatConnectionService implements OnModuleInit {
  private chatConnection: WebSocketSubject<TChatEvent<keyof IChatEventMap>>;

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
      next: event => console.log('> event', event),
      error: error => console.log('> error', error),
      complete: () => console.log('> completed'),
    });

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

  public joinChannel(channelId: string): void {
    this.sendEvent(CHAT_EVENT_TYPE.join, {
      channel_id: channelId
    });
  }

  public leaveChannel(channelId: string): void {
    this.sendEvent(CHAT_EVENT_TYPE.leave, {
      channel_id: channelId
    });
  }

  private sendEvent<T extends keyof IChatEventMap>(type: T, data: IChatEventMap[T]): void {
    this.chatConnection.next({ type, data });
  }
}
