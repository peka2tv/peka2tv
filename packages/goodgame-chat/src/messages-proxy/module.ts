import { Module } from '@nestjs/common';
import { ChatConnectionModule } from '../chat-connection/module';
import { MessagesProxyService } from './service/messages-proxy';
import { GoodgameApiModule } from '../api/module';
import { DbModule } from '../db/module';
import { Peka2tvChatSdkModule } from '../peka2tv-chat-sdk/module';

@Module({
  imports: [
    ChatConnectionModule,
    GoodgameApiModule,
    DbModule,
    Peka2tvChatSdkModule,
  ],
  providers: [
    MessagesProxyService,
  ],
})
export class MessagesProxyModule {
  constructor(
    _messagesProxyService: MessagesProxyService,
  ) {
  }
}
