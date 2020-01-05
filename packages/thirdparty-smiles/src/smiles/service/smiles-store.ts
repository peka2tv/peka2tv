import { Injectable } from '@nestjs/common';
import { ISmile, ISmileMain } from '../interface';

const DEFAULT_SMILE_DATA: ISmile = {
  id: null,
  code: '',
  url: '',
  width: null,
  height: null,
  tab: 0,
  position: 0,
  level: 0,
  masterStreamerLevel: 0,
  siteLevel: 0,
  user: null,
  icon: false,
  animated: false,
};

@Injectable()
export class SmilesStoreService {
  private smiles = new Map<string, ISmile>();
  private animatedSmiles = new Map<string, ISmile>();

  public addSmile(smile: ISmileMain, animated = false): void {
    if (animated) {
      this.animatedSmiles.set(smile.code, { ...DEFAULT_SMILE_DATA, ...smile });
    } else {
      this.smiles.set(smile.code, { ...DEFAULT_SMILE_DATA, ...smile });
    }
  }

  public getSmile(code: string, animated = false): ISmile | undefined {
    return animated && this.animatedSmiles.has(code) ? this.animatedSmiles.get(code) : this.smiles.get(code);
  }
}
