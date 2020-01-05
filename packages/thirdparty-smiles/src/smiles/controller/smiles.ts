import { Controller, Body, Post } from '@nestjs/common';
import { ISmile, IRequestSmile } from '../interface';
import { SmilesStoreService } from '../service/smiles-store';

@Controller()
export class SmilesController {
  constructor(private smilesStoreService: SmilesStoreService) {}

  @Post('/')
  public getSmiles(@Body() requestSmiles: IRequestSmile[]): ISmile[] {
    const responseSmiles = requestSmiles
      .map(({ code, animated }) => this.smilesStoreService.getSmile(code.toLowerCase(), animated))
      .filter((smile): smile is ISmile => !!smile);

    return responseSmiles;
  }
}
