import { Injectable, HttpService } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { CONFIG } from '../../../config/config';
import { ITwitchSmilesResponse } from '../interface';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { BasicLogger } from '@peka2tv/libs/core/logger';

const SMILES_URL = 'https://api.twitch.tv/helix/chat/emotes/global';
const ACCESS_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class TwitchApiService {
  private logger = new BasicLogger(this.constructor.name, CONFIG.logging.enabled);
  private accessToken$: Observable<string>;

  constructor(private httpService: HttpService) {
    this.accessToken$ = this.getAccessToken().pipe(shareReplay({ refCount: true, bufferSize: 1 }));
  }

  // TODO: load all smiles by channel or emotes sets
  public loadSmiles(): Observable<ITwitchSmilesResponse> {
    return this.accessToken$.pipe(
      switchMap(accessToken =>
        this.httpService.get<ITwitchSmilesResponse>(SMILES_URL, {
          headers: {
            'Client-Id': CONFIG.twitch.clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ),
      map(({ data }) => data),
      catchError(error => {
        this.logger.log('load smiles request error');

        return throwError(error);
      }),
    );
  }

  private getAccessToken(): Observable<string> {
    return this.httpService
      .post<AccessTokenResponse>(`${ACCESS_TOKEN_URL}`, null, {
        params: {
          grant_type: 'client_credentials',
          client_id: CONFIG.twitch.clientId,
          client_secret: CONFIG.twitch.clientSecret,
        },
      })
      .pipe(
        map(({ data }) => data.access_token),
        catchError(error => {
          this.logger.log('access token request error');

          return throwError(error);
        }),
      );
  }
}
