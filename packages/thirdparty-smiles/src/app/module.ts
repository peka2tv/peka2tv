import { Module } from '@nestjs/common';
import { SmilesModule } from '../smiles/module';
import { TwitchSmilesModule } from '../smiles-provider/twitch/module';
import { GoodgameSmilesModule } from '../smiles-provider/goodgame/module';

@Module({
  imports: [SmilesModule, TwitchSmilesModule, GoodgameSmilesModule],
})
export class ThirdpartySmilesModule {}
