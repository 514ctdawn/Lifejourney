export type AttributeKey = "I" | "R" | "A" | "L";
export type LifeStatusKey = "money" | "stress" | "happiness" | "integrity";
export type RiasecKey = "R" | "I" | "A" | "S" | "E" | "C";

export type Attributes = Record<AttributeKey, number>;
export type LifeStatus = Record<LifeStatusKey, number>;
export type RiasecVector = Record<RiasecKey, number>;

export type StageId = 1 | 2 | 3 | 4 | 5;

export type ScandalLevel = "none" | "warning" | "max";
export type HaggardLevel = "none" | "haggard";

export interface HiddenMetrics {
  riasec: RiasecVector;
  consistencyScore: number;
  scandalValue: number;
}

export interface PlayerSnapshot {
  attributes: Attributes;
  lifeStatus: LifeStatus;
  hidden: HiddenMetrics;
  stage: StageId;
  turnsRemaining: number;
  haggard: HaggardLevel;
  scandal: ScandalLevel;
}

export interface DreamCard {
  id: string;
  label: string;
  primaryRiasec: RiasecKey;
  secondaryRiasec?: RiasecKey;
}

export interface OptionEffect {
  attributes?: Partial<Attributes>;
  lifeStatus?: Partial<LifeStatus>;
  riasec?: Partial<RiasecVector>;
  consistencyWeight?: number;
  scandalDelta?: number;
  triggers?: {
    scandal?: boolean;
    haggard?: boolean;
    legend?: boolean;
  };
  notes?: string;
}

export interface ScenarioOption {
  id: "A" | "B" | "C" | "D";
  label: string;
  effect: OptionEffect;
  requirements?: {
    minAttributes?: Partial<Attributes>;
    minLifeStatus?: Partial<LifeStatus>;
  };
}

export interface Scenario {
  id: string;
  stage: StageId;
  title: string;
  description: string;
  options: ScenarioOption[];
  requirements?: {
    minAttributes?: Partial<Attributes>;
    minLifeStatus?: Partial<LifeStatus>;
  };
}

export interface ScenarioResult {
  scenarioId: string;
  optionId: ScenarioOption["id"];
  delta: OptionEffect;
  snapshot: PlayerSnapshot;
  reflection: {
    consistencyDelta: number;
    scandalPenalty: number;
    notes: string[];
  };
}

export interface Ending {
  id: string;
  title: string;
  description: string;
}
