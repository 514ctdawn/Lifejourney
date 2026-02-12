import { Scenario, StageId } from "./types";

export class ScenarioDataHandler {
  private scenarios: Scenario[];

  constructor(scenarios: Scenario[]) {
    this.scenarios = scenarios;
  }

  getByStage(stage: StageId): Scenario[] {
    return this.scenarios.filter((scenario) => scenario.stage === stage);
  }

  getScenarioById(id: string): Scenario | undefined {
    return this.scenarios.find((scenario) => scenario.id === id);
  }

  /**
   * Always returns some scenario as long as there is at least one in the data.
   * Prefer the current stage; if none exist, fall back to any scenario.
   */
  pickNextScenario(stage: StageId): Scenario | undefined {
    const inStage = this.getByStage(stage);
    const pool = inStage.length > 0 ? inStage : this.scenarios;
    if (pool.length === 0) return undefined;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }
}
