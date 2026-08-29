
import { type DevelopmentalGame } from './developmental-games';

export type RegimeKind = 'sleep' | 'milk' | 'meal' | 'ritual' | 'wake' | 'play' | 'other';

export type { DevelopmentalGame } from './developmental-games';

export interface RegimeStep {
  time: string; 
  startMin: number | null; 
  endMin: number | null; 
  action: string;
  note: string; 
  kind: RegimeKind;
  games?: DevelopmentalGame[];
  developmentalGamesGuidance?: string;
}

export interface RegimeVariant {
  name: string; 
  steps: RegimeStep[];
  developmentalGameGroups?: DevelopmentalGame[][];
}

export interface RegimeSummary {
  sleep24: string;
  naps: string;
  wakeWindow: string;
  wakeUp: string;
  nightSleep: string;
  features: string;
}

export interface RegimeAge {
  age: string; 
  timed: boolean; 
  summary: RegimeSummary | null;
  source: string;
  variants: RegimeVariant[];
  developmentalGameGroups?: DevelopmentalGame[][];
  developmentalGamesGuidance?: string;
}
