import { Module, DynamicModule } from '@nestjs/common';
import { Peka2tvChatSdkService } from './service/sdk';
import { PEKA2TV_SDK_CONFIG } from './const';
import { IPeka2tvSdkConfig } from './interface';

@Module({
})
export class Peka2tvChatSdkModule {
  public static forRoot(config: IPeka2tvSdkConfig): DynamicModule {
    return {
      module: Peka2tvChatSdkModule,
      providers: [
        { provide: PEKA2TV_SDK_CONFIG, useValue: config },
        Peka2tvChatSdkService,
      ],
      exports: [
        Peka2tvChatSdkService,
      ],
    };
  }
}
