import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatConnectionService } from '../../chat-connection/service/chat-connection';

@Injectable()
export class MessagesProxyService implements OnModuleInit {
  constructor(
    private chatConnectionService: ChatConnectionService,
  ) {
  }

  public onModuleInit() {
    this.joinChannel(3857);

    this.listenChannelsMessages();
  }

  private joinChannel(channelId: number): void {
    this.chatConnectionService.joinChannel(channelId);
  }

  private listenChannelsMessages(): void {
    this.chatConnectionService.onMessage()
      .subscribe(message => console.log('> message', message));
  }
}
