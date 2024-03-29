import { Injectable } from '@nestjs/common';
import { SmilesStoreService } from '../../../smiles/service/smiles-store';
import { TwitchApiService } from '../api/twitch';
import { map, switchMap, tap } from 'rxjs/operators';
import { ITwitchSmile } from '../interface';
import { ISmileMain } from '../../../smiles/interface';
import { timer } from 'rxjs';
import { BasicLogger } from '@peka2tv/libs/core/logger';
import { CONFIG } from '../../../config/config';

const SMILE_PREFIX = 'tw-';
const DEFAULT_WIDTH_PX = null;
const DEFAULT_HEIGHT_PX = 28;
const IMAGE_URL_TEMPLATE = 'https://static-cdn.jtvnw.net/emoticons/v2/{{ id }}/default/dark/2.0';
const UPDATE_INTERVAL_MS = 12 * 3600 * 1000;

@Injectable()
export class TwitchSmilesService {
  private logger = new BasicLogger(this.constructor.name, CONFIG.logging.enabled);

  constructor(private twitchApiService: TwitchApiService, private smilesStoreService: SmilesStoreService) {
    timer(0, UPDATE_INTERVAL_MS)
      .pipe(
        tap(() => this.logger.log(`started smiles loading`)),
        switchMap(() => this.twitchApiService.loadSmiles()),
        tap(() => this.logger.log(`started smiles formatting`)),
        map(({ data }) => this.formatSmiles(data)),
      )
      .subscribe(
        smiles => {
          smiles.forEach(smile => this.smilesStoreService.addSmile(smile));

          this.logger.log(`loaded ${smiles.length} smiles`);
        },
        error => this.logger.log(`smiles loading error ${error}`),
      );
  }

  private formatSmiles(twitchSmiles: ITwitchSmile[]): ISmileMain[] {
    return twitchSmiles
      .filter(smile => smile.name.indexOf('\\') === -1)
      .map(smile => ({
        id: null,
        code: `${SMILE_PREFIX}${smile.name.toLowerCase()}`,
        url: IMAGE_URL_TEMPLATE.replace('{{ id }}', smile.id),
        width: DEFAULT_WIDTH_PX,
        height: DEFAULT_HEIGHT_PX,
        animated: false,
      }));
  }
}
