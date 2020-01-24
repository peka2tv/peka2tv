import { Controller, Body, Post, HttpCode } from '@nestjs/common';
import { ISmile, IRequestSmile } from '../interface';
import { SmilesStoreService } from '../service/smiles-store';
import isArray from 'lodash/isArray';

@Controller()
export class SmilesController {
  constructor(private smilesStoreService: SmilesStoreService) {}

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
