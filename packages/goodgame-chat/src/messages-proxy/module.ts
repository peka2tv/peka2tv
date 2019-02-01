import { Module } from '@nestjs/common';
import { ChatConnectionModule } from '../chat-connection/module';
import { MessagesProxyService } from './service/messages-proxy';

@Module({
  imports: [
    ChatConnectionModule,
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
