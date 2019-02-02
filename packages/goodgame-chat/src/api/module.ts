import { Module, HttpModule } from '@nestjs/common';
import { GoodgameApiService } from './service/api';

@Module({
  imports: [
    HttpModule,
  ],
  providers: [
    GoodgameApiService,
  ],
  exports: [
    GoodgameApiService,
  ],
})
export class GoodgameApiModule {
}
