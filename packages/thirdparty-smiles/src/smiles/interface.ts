export interface ISmileMain {
  code: string;
  url: string;
  width: number | null;
  height: number | null;
  animated: boolean;
}

export interface ISmile extends ISmileMain {
  id: null;
  tab: 0;
  position: 0;
  level: 0;
  masterStreamerLevel: 0;
  siteLevel: 0;
  user: null;
  icon: false;
}

export interface IRequestSmile {
  code: string;
  animated?: boolean;
}
