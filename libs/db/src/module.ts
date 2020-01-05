import { Module, DynamicModule } from '@nestjs/common';
import { DbService } from './service/db';
import { DB_CONFIG_TOKEN } from './const';
import { IDbConfig } from './interface';

@Module({})
export class DbModule {
  public static forRoot(config: IDbConfig): DynamicModule {
    return {
      module: DbModule,
      providers: [{ provide: DB_CONFIG_TOKEN, useValue: config }, DbService],
      exports: [DbService],
    };
  }
}
