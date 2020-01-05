import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { createPool, Pool } from 'mysql';
import { Observable } from 'rxjs';
import { IDbConfig } from '../interface';
import { DB_CONFIG_TOKEN } from '../const';

@Injectable()
export class DbService implements OnModuleInit {
  private pool: Pool;

  constructor(@Inject(DB_CONFIG_TOKEN) private dbConfig: IDbConfig) {}

  public onModuleInit(): void {
    this.pool = createPool({
      ...this.dbConfig,
    });
  }

  public query<T>(query: string, data: unknown[] = []): Observable<T> {
    return new Observable(subscriber => {
      this.pool.query(query, data, (error, results) => {
        if (error) {
          subscriber.error(error);
          return;
        }

        subscriber.next(results);
        subscriber.complete();
      });
    });
  }
}
