import { Module } from '@nestjs/common';
import { Peka2tvChatSdkService } from './service/sdk';

@Module({
  providers: [
    Peka2tvChatSdkService,
  ],
  exports: [
    Peka2tvChatSdkService,
  ],
})
export class Peka2tvChatSdkModule {
}
