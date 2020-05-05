import { Controller, Body, Post, HttpCode } from '@nestjs/common';
import { ISmile, IRequestSmile } from '../interface';
import { SmilesStoreService } from '../service/smiles-store';
import isArray from 'lodash/isArray';

@Controller()
export class SmilesController {
  constructor(private smilesStoreService: SmilesStoreService) {}

  // Current implementation is cpu-optimized and requires a lot of memory to store all smiles full data
  // this leads to high memory consumption and fast `getSmiles` response
  // For memory-optimized you need to store minimum amount of data (e.x. only `id`/`code` fields for twitch smiles)
  // and format final object on each `getSmiles` request
  @Post('/')
  @HttpCode(200)
  public getSmiles(@Body() requestSmiles: IRequestSmile[]): ISmile[] {
    if (!requestSmiles || !isArray(requestSmiles)) {
      return [];
    }

    const responseSmiles = requestSmiles
      .filter(({ code }) => !!code)
      .map(({ code, animated }) => this.smilesStoreService.getSmile(code.toLowerCase(), animated))
      .filter((smile): smile is ISmile => !!smile);

    return responseSmiles;
  }
}
