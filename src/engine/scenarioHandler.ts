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

  pickNextScenario(stage: StageId, seen: Set<string>): Scenario | undefined {
    const pool = this.getByStage(stage).filter((scenario) => !seen.has(scenario.id));
    if (pool.length === 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }
}
