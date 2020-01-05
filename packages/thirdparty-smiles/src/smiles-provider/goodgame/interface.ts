export interface IGoodgameSmile {
  name: string;
  img_big: string;
  img: string;
  animated: boolean;
  img_gif: string;
}

export interface IGoodgameSmiles {
  Smiles: IGoodgameSmile[];
  Channel_Smiles: Record<string, IGoodgameSmile[]>;
}
