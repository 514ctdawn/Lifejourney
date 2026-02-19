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
   * Excludes scenarios that have already been used (by ID).
   */
  pickNextScenario(stage: StageId, usedIds: Set<string> = new Set()): Scenario | undefined {
    const inStage = this.getByStage(stage);
    const available = inStage.filter((s) => !usedIds.has(s.id));
    
    // If all scenarios in current stage are used, try next stages, then allow reuse
    if (available.length === 0) {
      // Try next stages
      for (let nextStage = stage + 1; nextStage <= 5; nextStage++) {
        const nextStageScenarios = this.getByStage(nextStage as StageId);
        const nextAvailable = nextStageScenarios.filter((s) => !usedIds.has(s.id));
        if (nextAvailable.length > 0) {
          const index = Math.floor(Math.random() * nextAvailable.length);
          return nextAvailable[index];
        }
      }
      // If all scenarios are used, allow reuse from current stage
      const pool = inStage.length > 0 ? inStage : this.scenarios;
      if (pool.length === 0) return undefined;
      const index = Math.floor(Math.random() * pool.length);
      return pool[index];
    }
    
    const index = Math.floor(Math.random() * available.length);
    return available[index];
  }
}
