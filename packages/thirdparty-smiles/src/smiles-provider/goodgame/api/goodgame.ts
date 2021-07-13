import { Injectable, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IGoodgameSmiles, IGoodgameSmile } from '../interface';
import _flatMap from 'lodash/flatMap';
import { BasicLogger } from '@peka2tv/libs/core/logger';
import { CONFIG } from '../../../config/config';

@Injectable()
export class GoodgameApiService {
  private logger = new BasicLogger(this.constructor.name, CONFIG.logging.enabled);

  constructor(private httpService: HttpService) {}

  public loadSmiles(): Observable<IGoodgameSmile[]> {
    return this.httpService.get<string>('https://static.goodgame.ru/js/minified/global.js').pipe(
      map(({ data }) => data),
      map(smilesJson => this.formatSmilesStringToObject(smilesJson)),
      map(smilesObject => this.formatSmiles(smilesObject)),
    );
  }

  private formatSmilesStringToObject(smilesString: string): IGoodgameSmiles | null {
    smilesString = smilesString
      .replace(/(var Global\n= )/, '')
      .replace('Smiles :', '"Smiles" : ')
      .replace('Channel_Smiles :', '"Channel_Smiles" : ')
      .replace('SmilesPacked :', '"SmilesPacked" : ')
      .replace('timezone_offset :', '"timezone_offset" : ')
      .replace('Content_Width:', '"Content_Width":')
      // last ';'
      .slice(0, -2);

    try {
      return JSON.parse(smilesString);
    } catch (_) {
      this.logger.log('global.js parsing error');

      return null;
    }
  }

  private formatSmiles(smilesObject: IGoodgameSmiles | null): IGoodgameSmile[] {
    if (!smilesObject) {
      return [];
    }

    return [...smilesObject.Smiles, ..._flatMap(smilesObject.Channel_Smiles)];
  }
}
