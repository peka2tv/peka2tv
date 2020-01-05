import { Module } from '@nestjs/common';
import { ChatConnectionModule } from '../chat-connection/module';
import { MessagesProxyService } from './service/messages-proxy';
import { GoodgameApiModule } from '../api/module';
import { DbModule } from '@peka2tv/libs/db';
import { CONFIG } from '../config/config';
import { Peka2tvChatSdkModule } from '@peka2tv/libs/peka2tv-chat-sdk';

@Module({
  imports: [
    ChatConnectionModule,
    GoodgameApiModule,
    DbModule.forRoot(CONFIG.db),
    Peka2tvChatSdkModule.forRoot({
      ...CONFIG.sdk,
      logging: {
        enabled: CONFIG.logging.enabled,
        main: CONFIG.logging.peka2tvSdkMainEvents,
        all: CONFIG.logging.peka2tvSdkAllEvents,
      },
    }),
  ],
  providers: [MessagesProxyService],
})
export class MessagesProxyModule {
  constructor(_messagesProxyService: MessagesProxyService) {}
}
