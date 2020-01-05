import { Module, HttpModule } from '@nestjs/common';
import { TwitchSmilesService } from './service/twitch-smiles';
import { SmilesModule } from '../../smiles/module';
import { TwitchApiService } from './api/twitch';

@Module({
  imports: [SmilesModule, HttpModule],
  providers: [TwitchSmilesService, TwitchApiService],
})
export class TwitchSmilesModule {}
