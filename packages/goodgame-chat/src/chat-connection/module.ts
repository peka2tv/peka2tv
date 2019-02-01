import { Module } from '@nestjs/common';
import { ChatConnectionService } from './service/chat-connection';

@Module({
  providers: [
    ChatConnectionService,
  ],
  exports: [
    ChatConnectionService,
  ],
})
export class ChatConnectionModule {
}