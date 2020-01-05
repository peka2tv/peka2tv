import { Injectable } from '@nestjs/common';
import { GoodgameApiService } from '../api/goodgame';
import { map, switchMap, tap } from 'rxjs/operators';
import { IGoodgameSmile } from '../interface';
import { ISmileMain } from '../../../smiles/interface';
import { SmilesStoreService } from '../../../smiles/service/smiles-store';
import { timer } from 'rxjs';
import { BasicLogger } from '@peka2tv/libs/core/logger';
import { CONFIG } from '../../../config/config';

const GOODGAME_SMILE_PREFIX = 'gg-';
const UPDATE_INTERVAL_MS = 12 * 3600 * 1000;

@Injectable()
export class GoodgameSmilesService {
  private logger = new BasicLogger(this.constructor.name, CONFIG.logging.enabled);

  constructor(private goodgameApiService: GoodgameApiService, private smilesStoreService: SmilesStoreService) {
    timer(0, UPDATE_INTERVAL_MS)
      .pipe(
        tap(() => this.logger.log(`started smiles loading`)),
        switchMap(() => this.goodgameApiService.loadSmiles()),
        map(goodgameSmiles => this.formatSmiles(goodgameSmiles)),
        tap(smiles => this.logger.log(`loaded ${smiles.length} smiles`)),
      )
      .subscribe(
        smiles => smiles.forEach(smile => this.smilesStoreService.addSmile(smile, smile.animated)),
        error => this.logger.log(`smiles loading error ${JSON.stringify(error)}`),
      );
  }

  private formatSmiles(goodgameSmiles: IGoodgameSmile[]): ISmileMain[] {
    const smiles: ISmileMain[] = [];

    goodgameSmiles.forEach(smile => {
      const code = `${GOODGAME_SMILE_PREFIX}${smile.name.toLowerCase()}`;
      const url = smile.img_big || smile.img;

      if (!url) {
        return;
      }

      smiles.push({
        code,
        url,
        width: null,
        height: null,
        animated: false,
      });

      if (smile.animated && smile.img_gif) {
        smiles.push({
          code,
          url: smile.img_gif,
          width: null,
          height: null,
          animated: true,
        });
      }
    });

    return smiles;
  }
}
