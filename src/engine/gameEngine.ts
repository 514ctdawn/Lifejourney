import { scoreConsistency } from "./consistency";
import { PlayerState } from "./playerState";
import { ScenarioDataHandler } from "./scenarioHandler";
import {
  DreamCard,
  Ending,
  OptionEffect,
  PlayerSnapshot,
  Scenario,
  ScenarioOption,
  ScenarioResult,
  StageId,
} from "./types";
import { SCENARIOS } from "../data/scenarios";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export class GameEngine {
  private scenarioHandler: ScenarioDataHandler;
  private seenScenarios = new Set<string>();
  private history: ScenarioResult[] = [];
  private player: PlayerState;

  constructor(dreamCard: DreamCard, totalTurns = 50, scenarios: Scenario[] = SCENARIOS) {
    this.player = new PlayerState(dreamCard, totalTurns);
    this.scenarioHandler = new ScenarioDataHandler(scenarios);
  }

  get snapshot(): PlayerSnapshot {
    return this.player.snapshot;
  }

  get historyLog(): ScenarioResult[] {
    return [...this.history];
  }

  spinLifeWheel(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  nextScenario(): Scenario | undefined {
    return this.scenarioHandler.pickNextScenario(this.player.stage, this.seenScenarios);
  }

  resolveScenario(scenarioId: string, optionId: ScenarioOption["id"]): ScenarioResult {
    const scenario = this.scenarioHandler.getScenarioById(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }
    const option = scenario.options.find((opt) => opt.id === optionId);
    if (!option) {
      throw new Error(`Option not found: ${optionId}`);
    }
    if (option.requirements?.minAttributes) {
      for (const [key, value] of Object.entries(option.requirements.minAttributes)) {
        if (this.player.attributes[key as keyof typeof this.player.attributes] < value) {
          throw new Error(`Requirement not met for option ${optionId}`);
        }
      }
    }
    if (option.requirements?.minLifeStatus) {
      for (const [key, value] of Object.entries(option.requirements.minLifeStatus)) {
        if (this.player.lifeStatus[key as keyof typeof this.player.lifeStatus] < value) {
          throw new Error(`Requirement not met for option ${optionId}`);
        }
      }
    }

    const effect: OptionEffect = option.effect ?? {};
    if (effect.attributes) {
      this.player.applyAttributes(effect.attributes);
    }
    if (effect.lifeStatus) {
      this.player.applyLifeStatus(effect.lifeStatus);
    }
    if (effect.riasec) {
      this.player.applyRiasec(effect.riasec);
    }
    if (typeof effect.scandalDelta === "number") {
      this.player.applyScandal(effect.scandalDelta);
    }
    if (effect.triggers?.scandal) {
      this.player.applyScandal(20);
    }

    const consistency = scoreConsistency(this.player.dreamCard, effect);
    this.player.applyConsistency(consistency.delta);

    this.player.endTurn();

    const result: ScenarioResult = {
      scenarioId,
      optionId,
      delta: effect,
      snapshot: this.player.snapshot,
      reflection: {
        consistencyDelta: consistency.delta,
        scandalPenalty: consistency.scandalPenalty,
        notes: consistency.notes,
      },
    };

    this.seenScenarios.add(scenarioId);
    this.history.push(result);
    return result;
  }

  getEndingScore(): number {
    const raw = this.history.reduce((total, entry) => {
      const weight = entry.delta.consistencyWeight ?? 1;
      return total + weight * entry.reflection.consistencyDelta - entry.reflection.scandalPenalty;
    }, 0);
    return clamp(Math.round(raw), -500, 500);
  }

  evaluateEnding(): Ending {
    const { attributes, lifeStatus, hidden } = this.player.snapshot;

    if (attributes.I > 90 && this.history.some((entry) => entry.delta.triggers?.legend)) {
      return {
        id: "ending-legendary-research",
        title: "傳奇研究中心創始人",
        description: "你以突破性研究開創了傳奇研究中心。",
      };
    }
    if (lifeStatus.money > 1_000_000 && lifeStatus.happiness < 30) {
      return { id: "ending-tired-billionaire", title: "疲憊的億萬富翁", description: "富有但疲憊。"};
    }
    if (attributes.A > 85 && lifeStatus.happiness > 80) {
      return { id: "ending-free-artist", title: "自由靈魂的藝術家", description: "你以藝術與自由著稱。"};
    }
    if (hidden.scandalValue >= 100) {
      return { id: "ending-scandal", title: "身敗名裂的捷徑者", description: "醜聞主導了你的結局。"};
    }
    if (this.history.some((entry) => entry.delta.notes?.includes("Reversal roulette"))) {
      return { id: "ending-reversal", title: "絕地逆襲的贏家", description: "逆轉島的選擇改變了人生。"};
    }
    if (hidden.riasec.S > 85) {
      return { id: "ending-mentor", title: "卓越的公共導師", description: "你的一生啟發他人。" };
    }
    if (hidden.riasec.C > 90) {
      return { id: "ending-order-guardian", title: "嚴謹的秩序守護者", description: "你建立秩序的基石。" };
    }
    if (hidden.riasec.I > 85 && hidden.riasec.S < 30) {
      return { id: "ending-data-hermit", title: "數據時代的隱士", description: "你的算法支撐社會。" };
    }
    if (attributes.R > 80 && hidden.riasec.E < 30) {
      return { id: "ending-forgotten-gear", title: "被遺忘的技術齒輪", description: "你默默奉獻被取代。" };
    }
    if (attributes.A > 80 && lifeStatus.stress > 70) {
      return { id: "ending-content-tourist", title: "內容帝國的過客", description: "曾短暫成名而後退場。" };
    }
    if (attributes.R > 90 && lifeStatus.stress > 60) {
      return { id: "ending-athlete", title: "熱血的競技巨星", description: "燃燒青春奪得榮耀。" };
    }
    if (attributes.I > 80 && attributes.A > 80) {
      return { id: "ending-cross-innovator", title: "跨界創新領袖", description: "整合科技與藝術開創新局。" };
    }
    if (hidden.riasec.E > 85 && hidden.riasec.S < 40) {
      return { id: "ending-power-broker", title: "幕後權力經紀人", description: "你掌控資源而低調。" };
    }
    if (lifeStatus.money < 200 && lifeStatus.happiness > 95) {
      return { id: "ending-minimalist", title: "知足的極簡主義者", description: "在簡約中找到自由。" };
    }
    if (this.history.some((entry) => entry.delta.notes?.includes("Reversal roulette")) && hidden.scandalValue > 0) {
      return { id: "ending-gambler", title: "失意的賭徒", description: "等待奇蹟卻落空。" };
    }
    if (this.isMostlyStableDecisions()) {
      return { id: "ending-heir", title: "家族遺產守成者", description: "穩定守成的一生。" };
    }
    if (this.history.some((entry) => entry.delta.notes?.includes("Travel"))) {
      return { id: "ending-explorer", title: "全球遠征的探索者", description: "你的旅途激發後輩。" };
    }
    if (this.isBalancedProfile()) {
      return { id: "ending-ghost", title: "系統中的幽靈", description: "你在平衡中淡然離去。" };
    }
    if (hidden.riasec.E > 70 && attributes.I > 70 && lifeStatus.stress > 80) {
      return { id: "ending-martyr", title: "技術創業的殉道者", description: "成功前夜倒下。" };
    }
    if (this.history.some((entry) => entry.delta.notes?.includes("Reversal roulette"))) {
      return { id: "ending-awakening", title: "重啟人生的覺醒者", description: "解鎖二周目命運。" };
    }

    return { id: "ending-default", title: "人生旅途的旅人", description: "你的旅程留下獨特足跡。" };
  }

  generateLifeReflectionReport() {
    const ending = this.evaluateEnding();
    return {
      ending,
      endingScore: this.getEndingScore(),
      riasecProfile: this.player.snapshot.hidden.riasec,
      stageSummaries: this.history.reduce<Record<StageId, number>>(
        (acc, entry) => {
          const stage = this.scenarioHandler.getScenarioById(entry.scenarioId)?.stage ?? 1;
          acc[stage] = (acc[stage] ?? 0) + 1;
          return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ),
    };
  }

  private isBalancedProfile(): boolean {
    const values = Object.values(this.player.snapshot.attributes);
    const max = Math.max(...values);
    const min = Math.min(...values);
    return max - min <= 15;
  }

  private isMostlyStableDecisions(): boolean {
    const stable = this.history.filter((entry) => entry.delta.consistencyWeight && entry.delta.consistencyWeight >= 1.2);
    return stable.length >= Math.floor(this.history.length * 0.4);
  }
}
