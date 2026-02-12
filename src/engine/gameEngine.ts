import { scoreConsistency } from "./consistency";
import { PlayerState } from "./playerState";
import { ScenarioDataHandler } from "./scenarioHandler";
import {
  DreamCard,
  Ending,
  IntroProfile,
  IntroStatKey,
  IntroStats,
  OptionEffect,
  PlayerSnapshot,
  RiasecKey,
  RiasecVector,
  Scenario,
  ScenarioOption,
  ScenarioResult,
  StageId,
} from "./types";
import { SCENARIOS } from "../data/scenarios";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const CAREER_SUGGESTIONS: Record<IntroStatKey, { title: string; description: string }[]> = {
  Ambition: [
    { title: "創業家／CEO", description: "擅長整合資源、承擔風險，帶領團隊衝刺成長。" },
    { title: "企業策略顧問", description: "為公司設計成長路線與併購策略，習慣高壓決策。" },
    { title: "投資銀行分析師", description: "在快速節奏下處理大型交易與財務模型。" },
    { title: "律師", description: "結合法規與溝通技巧，在談判中為客戶爭取最大利益。" },
    { title: "業務／業務經理", description: "以業績與人脈為導向，喜歡明確目標與挑戰。" },
    { title: "產品經理", description: "在技術與商業之間協調，決定產品的方向與節奏。" },
  ],
  Creativity: [
    { title: "UX／UI 設計師", description: "結合美感與使用者心理，設計好玩的介面與互動。" },
    { title: "遊戲設計師", description: "設計關卡、劇情與系統，打造完整遊戲體驗。" },
    { title: "品牌／視覺設計師", description: "用顏色與形狀說故事，建立獨特品牌形象。" },
    { title: "建築師", description: "把抽象概念轉化為真實空間，兼具創意與結構思維。" },
    { title: "多媒體創作者", description: "透過影像、音樂與動態設計來表達想法。" },
    { title: "服務設計師", description: "重組整體服務流程，讓使用者旅程更直覺、順暢。" },
  ],
  Stability: [
    { title: "財務規劃師", description: "幫助個人與家庭配置資產，追求長期穩健成長。" },
    { title: "資料分析師", description: "在有結構的環境中整理數據並提供決策依據。" },
    { title: "公務員／行政人員", description: "偏好制度明確、流程穩定的工作環境。" },
    { title: "人資專員", description: "在規則框架下照顧組織與同事的需求。" },
    { title: "風險管理專員", description: "預先思考最壞情況，確保組織不踩雷。" },
    { title: "醫療管理人員", description: "協調醫護團隊與資源，維持長期、高品質運作。" },
  ],
};

function getDominantIntroTrait(stats?: IntroStats): IntroStatKey | null {
  if (!stats) return null;
  const entries = Object.entries(stats) as [IntroStatKey, number][];
  if (!entries.length) return null;
  const { key } = entries.reduce(
    (best, [k, v]) => (v > best.value ? { key: k, value: v } : best),
    { key: "Stability" as IntroStatKey, value: -1 }
  );
  return key;
}

function getTopRiasecKey(vec: RiasecVector): RiasecKey {
  const entries = Object.entries(vec) as [RiasecKey, number][];
  return entries.reduce((best, [k, v]) => (v > best.value ? { key: k, value: v } : best), {
    key: "I" as RiasecKey,
    value: -1,
  }).key;
}

function buildCareerSuggestions(
  introProfile: IntroProfile | null | undefined,
  riasec: RiasecVector
): { title: string; description: string }[] {
  const dominant = getDominantIntroTrait(introProfile?.stats);
  if (!dominant) return [];

  // In the未來 can further specialize by RIASEC code; 目前先依人格大類提供 5–6 個方向。
  return CAREER_SUGGESTIONS[dominant] ?? [];
}

export class GameEngine {
  private scenarioHandler: ScenarioDataHandler;
  private history: ScenarioResult[] = [];
  private player: PlayerState;

  constructor(
    dreamCard: DreamCard,
    totalTurns = 50,
    scenarios: Scenario[] = SCENARIOS,
    initialConsistency = 0
  ) {
    this.player = new PlayerState(dreamCard, totalTurns);
    if (initialConsistency !== 0) {
      this.player.applyConsistency(initialConsistency);
    }
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
    return this.scenarioHandler.pickNextScenario(this.player.stage);
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
    // UX: if an option doesn't touch any visible stats at all,
    // give a small default變化，讓玩家每次選擇都能在 HUD 上看到回饋。
    if (!effect.attributes && !effect.lifeStatus) {
      effect.lifeStatus = { happiness: 5 };
    }
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

  generateLifeReflectionReport(introProfile?: IntroProfile | null) {
    const ending = this.evaluateEnding();
    const riasecProfile = this.player.snapshot.hidden.riasec;
    return {
      ending,
      endingScore: this.getEndingScore(),
      riasecProfile,
      stageSummaries: this.history.reduce<Record<StageId, number>>(
        (acc, entry) => {
          const stage = this.scenarioHandler.getScenarioById(entry.scenarioId)?.stage ?? 1;
          acc[stage] = (acc[stage] ?? 0) + 1;
          return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ),
      suggestedJobs: buildCareerSuggestions(introProfile ?? null, riasecProfile),
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
