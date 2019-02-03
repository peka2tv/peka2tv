import { Module } from '@nestjs/common';
import { DbService } from './service/db';

@Module({
  providers: [
    DbService,
  ],
  exports: [
    DbService,
  ],
})
export class DbModule {
}
