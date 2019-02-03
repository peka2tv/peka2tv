import { Injectable, OnModuleInit } from '@nestjs/common';
import { CONFIG } from '../../config/config';
import { IPeka2tvChatNewMessage } from '../interface';
import io from 'socket.io-client';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { LoggerService } from '../../shared/service/logger';

@Injectable()
export class Peka2tvChatSdkService implements OnModuleInit {
  private sdkConnection: SocketIOClient.Socket;

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
    this.sdkConnection = io.connect(CONFIG.sdk.url, {
      transports: ['websocket'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      reconnectionAttempts: Infinity
    });

    this.onEvent('connect')
      .subscribe(() => this.log('sdk connected', CONFIG.logging.peka2tvSdkMainEvents));

    this.onEvent<any>('error')
      .subscribe(error => this.log(`sdk error ${JSON.stringify(error)}`, CONFIG.logging.peka2tvSdkMainEvents));

    this.onEvent('disconnect')
      .subscribe(() => this.log('sdk disconnect', CONFIG.logging.peka2tvSdkMainEvents));

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
    this.log(`send ${JSON.stringify(message)}`, CONFIG.logging.peka2tvSdkAllEvents);

    this.sdkConnection.emit('/sdk/publish', message);
  }

  private log(message: string, enabled: boolean): void {
    if (!enabled) {
      return;
    }

    this.loggerService.log(message, this.constructor.name);
  }
}
