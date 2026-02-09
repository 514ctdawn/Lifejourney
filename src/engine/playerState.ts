import {
  Attributes,
  DreamCard,
  HiddenMetrics,
  HaggardLevel,
  LifeStatus,
  PlayerSnapshot,
  RiasecVector,
  ScandalLevel,
  StageId,
} from "./types";

const DEFAULT_ATTRIBUTES: Attributes = { I: 10, R: 10, A: 10, L: 10 };
const DEFAULT_LIFESTATUS: LifeStatus = {
  money: 100,
  stress: 10,
  happiness: 50,
  integrity: 50,
};
const DEFAULT_RIASEC: RiasecVector = {
  R: 10,
  I: 10,
  A: 10,
  S: 10,
  E: 10,
  C: 10,
};

export class PlayerState {
  attributes: Attributes;
  lifeStatus: LifeStatus;
  hidden: HiddenMetrics;
  stage: StageId;
  turnsRemaining: number;
  haggard: HaggardLevel;
  scandal: ScandalLevel;
  dreamCard: DreamCard;

  constructor(dreamCard: DreamCard, totalTurns = 50) {
    this.attributes = { ...DEFAULT_ATTRIBUTES };
    this.lifeStatus = { ...DEFAULT_LIFESTATUS };
    this.hidden = {
      riasec: { ...DEFAULT_RIASEC },
      consistencyScore: 0,
      scandalValue: 0,
    };
    this.stage = 1;
    this.turnsRemaining = totalTurns;
    this.haggard = "none";
    this.scandal = "none";
    this.dreamCard = dreamCard;
  }

  get snapshot(): PlayerSnapshot {
    return {
      attributes: { ...this.attributes },
      lifeStatus: { ...this.lifeStatus },
      hidden: {
        riasec: { ...this.hidden.riasec },
        consistencyScore: this.hidden.consistencyScore,
        scandalValue: this.hidden.scandalValue,
      },
      stage: this.stage,
      turnsRemaining: this.turnsRemaining,
      haggard: this.haggard,
      scandal: this.scandal,
    };
  }

  applyAttributes(delta: Partial<Attributes>) {
    for (const key of Object.keys(delta) as (keyof Attributes)[]) {
      this.attributes[key] = Math.max(0, this.attributes[key] + (delta[key] ?? 0));
    }
  }

  applyLifeStatus(delta: Partial<LifeStatus>) {
    for (const key of Object.keys(delta) as (keyof LifeStatus)[]) {
      this.lifeStatus[key] = Math.max(0, this.lifeStatus[key] + (delta[key] ?? 0));
    }
  }

  applyRiasec(delta: Partial<RiasecVector>) {
    for (const key of Object.keys(delta) as (keyof RiasecVector)[]) {
      this.hidden.riasec[key] = Math.max(0, this.hidden.riasec[key] + (delta[key] ?? 0));
    }
  }

  applyConsistency(delta: number) {
    this.hidden.consistencyScore = Math.max(0, this.hidden.consistencyScore + delta);
  }

  applyScandal(delta: number) {
    this.hidden.scandalValue = Math.max(0, this.hidden.scandalValue + delta);
    if (this.hidden.scandalValue >= 100) {
      this.scandal = "max";
    } else if (this.hidden.scandalValue >= 40) {
      this.scandal = "warning";
    }
  }

  updateHaggard() {
    const stressHigh = this.lifeStatus.stress >= 80;
    const healthLow = this.attributes.R <= 15;
    this.haggard = stressHigh || healthLow ? "haggard" : "none";
  }

  advanceStageIfNeeded() {
    const turnsUsed = 50 - this.turnsRemaining;
    if (turnsUsed >= 40) {
      this.stage = 5;
    } else if (turnsUsed >= 30) {
      this.stage = 4;
    } else if (turnsUsed >= 20) {
      this.stage = 3;
    } else if (turnsUsed >= 10) {
      this.stage = 2;
    } else {
      this.stage = 1;
    }
  }

  endTurn() {
    this.turnsRemaining = Math.max(0, this.turnsRemaining - 1);
    this.advanceStageIfNeeded();
    this.updateHaggard();
    if (this.lifeStatus.integrity < 20 && this.scandal !== "max") {
      this.scandal = "warning";
    }
  }
}
