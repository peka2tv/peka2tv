import { Module } from '@nestjs/common';
import { ChatConnectionService } from './service/chat-connection';
import { SharedModule } from '../shared/module';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    ChatConnectionService,
  ],
  exports: [
    ChatConnectionService,
  ],
})
export class ChatConnectionModule {
}
