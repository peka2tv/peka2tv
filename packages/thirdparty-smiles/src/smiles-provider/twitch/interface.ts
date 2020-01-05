export interface ITwitchSmile {
  id: string;
  code: string;
}

export interface ITwitchSmilesResponse {
  emoticons: ITwitchSmile[];
}
