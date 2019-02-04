import { Module } from '@nestjs/common';
import { LoggerService } from './service/logger';

@Module({
  providers: [
    LoggerService,
  ],
  exports: [
    LoggerService,
  ],
})
export class SharedModule {
}
