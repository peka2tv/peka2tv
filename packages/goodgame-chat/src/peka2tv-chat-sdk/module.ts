import { Module } from '@nestjs/common';
import { Peka2tvChatSdkService } from './service/sdk';
import { SharedModule } from '../shared/module';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    Peka2tvChatSdkService,
  ],
  exports: [
    Peka2tvChatSdkService,
  ],
})
export class Peka2tvChatSdkModule {
}
