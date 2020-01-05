import { Module } from '@nestjs/common';
import { SmilesStoreService } from './service/smiles-store';
import { SmilesController } from './controller/smiles';

@Module({
  providers: [SmilesStoreService],
  controllers: [SmilesController],
  exports: [SmilesStoreService],
})
export class SmilesModule {}
