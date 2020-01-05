import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { IPeka2tvChatNewMessage, IPeka2tvSdkConfig } from '../interface';
import io from 'socket.io-client';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { BasicLogger } from '@peka2tv/libs/core/logger';
import { PEKA2TV_SDK_CONFIG } from '../const';

@Injectable()
export class Peka2tvChatSdkService implements OnModuleInit {
  private sdkConnection: SocketIOClient.Socket;
  private logger = new BasicLogger(this.constructor.name, this.sdkConfig.logging.enabled);

  constructor(@Inject(PEKA2TV_SDK_CONFIG) private sdkConfig: IPeka2tvSdkConfig) {}

  // TODO: delay  startup until connection done
  public onModuleInit() {
    return this.connect();
  }

  public connect() {
    this.sdkConnection = io.connect(this.sdkConfig.url, {
      transports: ['websocket'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      reconnectionAttempts: Infinity,
    });

    this.onEvent('connect').subscribe(() => this.logger.log('sdk connected', this.sdkConfig.logging.main));

    this.onEvent<any>('error').subscribe(error =>
      this.logger.log(`sdk error ${JSON.stringify(error)}`, this.sdkConfig.logging.main),
    );

    this.onEvent('disconnect').subscribe(() => this.logger.log('sdk disconnect', this.sdkConfig.logging.main));

    return this.onEvent('connect').pipe(take(1));
  }

  public onEvent<T = void>(event: string): Observable<T> {
    return new Observable(subscriber => {
      const listener = (data: T) => subscriber.next(data);

      this.sdkConnection.on(event, listener);

      return () => this.sdkConnection.off(event, listener);
    });
  }

  public send(message: IPeka2tvChatNewMessage): void {
    this.logger.log(`send ${JSON.stringify(message)}`, this.sdkConfig.logging.all);

    this.sdkConnection.emit('/sdk/publish', message);
  }
}
