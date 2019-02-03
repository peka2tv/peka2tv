import { Injectable, OnModuleInit } from '@nestjs/common';
import { CONFIG } from '../../config/config';
import { IPeka2tvChatNewMessage } from '../interface';
import io from 'socket.io-client';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable()
export class Peka2tvChatSdkService implements OnModuleInit {
  private sdkConnection: SocketIOClient.Socket;

  // TODO: delay  startup until connection done
  public onModuleInit() {
    return this.connect();
  }

  public connect(
  ) {
    this.sdkConnection = io.connect(CONFIG.sdk.url, {
      transports: ['websocket'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      reconnectionAttempts: Infinity
    });

    this.onEvent('connect')
      .subscribe(() => console.log('> peka2tv sdk connected'));

    this.onEvent<any>('error')
      .subscribe(error => console.log('> peka2tv sdk error', error));

    this.onEvent('disconnect')
      .subscribe(() => console.log('> peka2tv sdk disconnect'));

    return this.onEvent('connect').pipe(
      take(1),
    );
  }

  public onEvent<T = void>(event: string): Observable<T> {
    return new Observable(subscriber => {
      const listener = (data: T) => subscriber.next(data);

      this.sdkConnection.on(event, listener);

      return () => this.sdkConnection.off(event, listener);
    });
  }

  public send(message: IPeka2tvChatNewMessage): void {
    console.log('> send', message);

    this.sdkConnection.emit('/sdk/publish', message);
  }
}
