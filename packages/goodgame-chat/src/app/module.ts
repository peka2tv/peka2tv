import { Module } from '@nestjs/common';
import { MessagesProxyModule } from '../messages-proxy/module';

@Module({
  imports: [MessagesProxyModule],
})
export class GoodgameChatModule {}
