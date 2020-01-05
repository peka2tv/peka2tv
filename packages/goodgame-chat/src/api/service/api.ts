import { Injectable, HttpService } from '@nestjs/common';
import { CONFIG } from '../../config/config';
import { Observable } from 'rxjs';
import { IChannelStatus } from '../interface';
import { map } from 'rxjs/operators';

@Injectable()
export class GoodgameApiService {
  private endpoint = CONFIG.endpoints.api;

  constructor(private httpService: HttpService) {}

  public getChannelStatus(id: string, timeout?: number): Observable<Record<string, IChannelStatus>> {
    return this.httpService
      .get<Record<string, IChannelStatus>>(`${this.endpoint}/getchannelstatus`, {
        params: { fmt: 'json', id },
        timeout,
      })
      .pipe(map(({ data }) => data));
  }
}
