import { Injectable, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CONFIG } from '../../../config/config';
import { ITwitchSmilesResponse } from '../interface';
import { map } from 'rxjs/operators';

const SMILES_URL = 'https://api.twitch.tv/kraken/chat/emoticon_images';

@Injectable()
export class TwitchApiService {
  constructor(private httpService: HttpService) {}

  public loadSmiles(): Observable<ITwitchSmilesResponse> {
    return this.httpService
      .get<ITwitchSmilesResponse>(SMILES_URL, {
        headers: {
          'Client-ID': CONFIG.twitch.clientId,
          Accept: 'application/vnd.twitchtv.v5+json',
        },
      })
      .pipe(map(({ data }) => data));
  }
}
