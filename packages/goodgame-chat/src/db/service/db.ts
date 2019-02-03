import { Injectable, OnModuleInit } from '@nestjs/common';
import { createPool, Pool } from 'mysql';
import { CONFIG } from '../../config/config';
import { Observable } from 'rxjs';

@Injectable()
export class DbService implements OnModuleInit {
  private pool: Pool;

  public onModuleInit(): void {
    this.pool = createPool({
      ...CONFIG.db,
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
