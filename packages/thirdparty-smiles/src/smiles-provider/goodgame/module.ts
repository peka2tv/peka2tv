import { Module, HttpModule } from '@nestjs/common';
import { GoodgameApiService } from './api/goodgame';
import { GoodgameSmilesService } from './service/goodgame-smiles';
import { SmilesModule } from '../../smiles/module';

@Module({
  imports: [HttpModule, SmilesModule],
  providers: [GoodgameApiService, GoodgameSmilesService],
})
export class GoodgameSmilesModule {}
