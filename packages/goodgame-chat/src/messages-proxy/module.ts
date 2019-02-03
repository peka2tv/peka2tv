import { Module } from '@nestjs/common';
import { ChatConnectionModule } from '../chat-connection/module';
import { MessagesProxyService } from './service/messages-proxy';
import { GoodgameApiModule } from '../api/module';
import { DbModule } from '../db/module';

@Module({
  imports: [
    ChatConnectionModule,
    GoodgameApiModule,
    DbModule,
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
