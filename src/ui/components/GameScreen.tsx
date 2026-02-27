import React, { useMemo, useRef, useState } from "react";
import { GameEngine } from "../../engine/gameEngine";
import {
  DreamCard,
  IntroProfile,
  IntroStatKey,
  IntroStats,
  Scenario,
  ScenarioOption,
} from "../../engine/types";
import { UIManager } from "../uiManager";
import { HudBars } from "./HudBars";
import { StatsHistogram } from "./StatsHistogram";
import { LifeWheel } from "./LifeWheel";
import { MapWithMarkers, MAX_PROGRESS_INDEX } from "./MapWithMarkers";
import { ScenarioCard } from "./ScenarioCard";
import { ReflectionReport } from "./ReflectionReport";
import mapImg from "/city_updatedRoad.jpg";
import femaleSprite from "/female.png";
import maleSprite from "/male.png";
import bearSprite from "/bear.png";

type DreamCardWithIcon = DreamCard & { icon: string; subtitle: string };

const DREAM_CARDS: DreamCardWithIcon[] = [
  {
    id: "surgeon",
    label: "頂級外科醫生",
    primaryRiasec: "I",
    secondaryRiasec: "S",
    icon: "🩺",
    subtitle: "高壓高責任的專業路徑",
  },
  {
    id: "artist",
    label: "新銳藝術家",
    primaryRiasec: "A",
    secondaryRiasec: "S",
    icon: "🎨",
    subtitle: "以創作與表達為核心",
  },
  {
    id: "founder",
    label: "科技創業家",
    primaryRiasec: "E",
    secondaryRiasec: "I",
    icon: "🚀",
    subtitle: "把點子變成公司的人",
  },
  {
    id: "designer",
    label: "體驗設計師",
    primaryRiasec: "A",
    secondaryRiasec: "I",
    icon: "🕹️",
    subtitle: "介於藝術與系統思維之間",
  },
  {
    id: "planner",
    label: "城市規劃師",
    primaryRiasec: "I",
    secondaryRiasec: "C",
    icon: "🏙️",
    subtitle: "用地圖與數據設計城市未來",
  },
  {
    id: "mentor",
    label: "生涯導師",
    primaryRiasec: "S",
    secondaryRiasec: "E",
    icon: "🧭",
    subtitle: "陪伴他人做出長期選擇",
  },
];

type ReflectionReportData = {
  ending: { title: string; description: string };
  endingScore: number;
  riasecProfile: Record<string, number>;
  stageSummaries: Record<string, number>;
  suggestedJobs: { title: string; description: string }[];
};

// Full 50 scenarios (階段一～五)
const TOTAL_TURNS = 50;

function getDominantTrait(stats: IntroStats | undefined | null): IntroStatKey | null {
  if (!stats) return null;
  const entries = Object.entries(stats) as [IntroStatKey, number][];
  if (!entries.length) return null;
  const { key } = entries.reduce(
    (best, [k, v]) => (v > best.value ? { key: k, value: v } : best),
    { key: "Stability" as IntroStatKey, value: -1 }
  );
  return key;
}

function getRecommendedDreamIdForTrait(trait: IntroStatKey | null): DreamCard["id"] | null {
  switch (trait) {
    case "Ambition":
      // 企圖心與地位導向 → 創業家
      return "founder";
    case "Creativity":
      // 創作與表達導向 → 藝術家
      return "artist";
    case "Stability":
      // 穩定與責任導向 → 醫生路徑
      return "surgeon";
    default:
      return null;
  }
}

function getDestinyBonus(profile: IntroProfile | null | undefined, card: DreamCard): number {
  const trait = getDominantTrait(profile?.stats);
  const recommendedId = getRecommendedDreamIdForTrait(trait);
  if (recommendedId && recommendedId === card.id) {
    return 10;
  }
  return 0;
}

export function GameScreen({ profile }: { profile?: IntroProfile | null }) {
  const uiManager = useMemo(() => new UIManager(), []);
  const dominantTrait = getDominantTrait(profile?.stats);
  const recommendedDreamId = getRecommendedDreamIdForTrait(dominantTrait);
  const initialCard = useMemo(() => {
    const id = recommendedDreamId ?? DREAM_CARDS[0].id;
    return DREAM_CARDS.find((c) => c.id === id) ?? DREAM_CARDS[0];
  }, [recommendedDreamId]);
  const [dreamCard, setDreamCard] = useState<DreamCard>(initialCard);
  const engineRef = useRef<GameEngine | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [report, setReport] = useState<ReflectionReportData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [, setTick] = useState(0);
  const [pathIndex, setPathIndex] = useState(0);
  const [mapError, setMapError] = useState(false);
  const [floatingDeltas, setFloatingDeltas] = useState<{ money?: number; stress?: number; happiness?: number } | null>(null);
  const [showTraitsPanel, setShowTraitsPanel] = useState(false);
  const [showWheelOnMobile, setShowWheelOnMobile] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const mapScrollRef = useRef<HTMLDivElement>(null);

  const scrollMapRight = () => {
    const el = mapScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
  };
  const scrollMapLeft = () => {
    const el = mapScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
  };

  const markerSprite =
    profile?.gender === "女"
      ? femaleSprite
      : profile?.gender === "男"
        ? maleSprite
        : profile?.gender
          ? bearSprite
          : maleSprite;

  const ensureEngine = () => {
    if (!engineRef.current) {
      const bonus = getDestinyBonus(profile ?? null, dreamCard);
      engineRef.current = new GameEngine(dreamCard, TOTAL_TURNS, undefined, bonus);
    }
    return engineRef.current;
  };

  const startNewRun = (card: DreamCard) => {
    const bonus = getDestinyBonus(profile ?? null, card);
    engineRef.current = new GameEngine(card, TOTAL_TURNS, undefined, bonus);
    setScenario(engineRef.current.nextScenario() ?? null);
    setReport(null);
    setLastRoll(null);
    setPathIndex(0);
    setTick((t) => t + 1);
  };

  const engine = ensureEngine();
  const snapshot = engine.snapshot;
  const mood = uiManager.getMood(snapshot);

  const onSpin = () => {
    const roll = engine.spinLifeWheel();
    setLastRoll(roll);
    return roll;
  };

  const onSpinComplete = () => {
    const next = engine.nextScenario();
    if (next) {
      setScenario(next);
    } else {
      setScenario({
        id: "fallback",
        stage: snapshot.stage,
        title: "臨時情境：系統找不到題目",
        description: "為了讓流程不中斷，這是一個臨時題目。請隨意選一個選項繼續體驗。",
        options: [
          { id: "A", label: "穩穩前進", effect: {} },
          { id: "B", label: "嘗試新路", effect: {} },
          { id: "C", label: "暫停休息", effect: {} },
          { id: "D", label: "交給命運", effect: {} },
        ],
      });
    }
  };

  const isOptionLocked = (option: ScenarioOption) => {
    const req = option.requirements;
    if (!req) return false;
    if (req.minAttributes) {
      for (const [key, value] of Object.entries(req.minAttributes)) {
        if (snapshot.attributes[key as keyof typeof snapshot.attributes] < value) {
          return true;
        }
      }
    }
    if (req.minLifeStatus) {
      for (const [key, value] of Object.entries(req.minLifeStatus)) {
        if (snapshot.lifeStatus[key as keyof typeof snapshot.lifeStatus] < value) {
          return true;
        }
      }
    }
    return false;
  };

  const handleOptionPick = (optionId: ScenarioOption["id"]) => {
    if (!scenario) return;
    const option = scenario.options.find((o) => o.id === optionId);
    const lifeDelta = option?.effect?.lifeStatus;
    engine.resolveScenario(scenario.id, optionId);
    setScenario(null);
    if (lastRoll) {
      const start = pathIndex;
      const target = Math.min(start + lastRoll, MAX_PROGRESS_INDEX);
      if (target > start) {
        let current = start;
        const stepOnce = () => {
          current += 1;
          setPathIndex(current);
          if (current < target) {
            setTimeout(stepOnce, 220);
          }
        };
        setTimeout(stepOnce, 220);
      }
      setLastRoll(null);
    }
    setTick((t) => t + 1);
    if (lifeDelta && (lifeDelta.money !== undefined || lifeDelta.stress !== undefined || lifeDelta.happiness !== undefined)) {
      setFloatingDeltas({
        money: lifeDelta.money,
        stress: lifeDelta.stress,
        happiness: lifeDelta.happiness,
      });
      setTimeout(() => setFloatingDeltas(null), 2500);
    }
    if (engine.snapshot.turnsRemaining === 0) {
      setReport(engine.generateLifeReflectionReport(profile ?? null));
      setShowReport(true);
    }
  };

  return (
    <div className={`app-shell mood-${mood}`}>
      {/* Desktop: original two-column layout with map */}
      <div className="app-desktop">
        <div className="app-left">
          <header className="app-header">
            <div>
              <h1>人生旅程：數位人生</h1>
              {profile?.name ? (
                <p className="muted">{profile.name} · 歡迎進入【未來軌跡】—— 走下去，才知道終點在哪裡。</p>
              ) : (
                <p className="muted">歡迎進入【未來軌跡】—— 走下去，才知道終點在哪裡。</p>
              )}
            </div>
          </header>
          <div className="app-left-scroll">
            <section className="hud-section">
              <HudBars bars={uiManager.getHudBars(snapshot)} />
              <div className="status-panel">
                <div>階段：{snapshot.stage}</div>
                <div>剩餘回合：{snapshot.turnsRemaining}</div>
                <div>一致性：{snapshot.hidden.consistencyScore}</div>
                <div>醜聞值：{snapshot.hidden.scandalValue}</div>
              </div>
            </section>
            <section className="main-grid">
              <LifeWheel
                segments={uiManager.buildLifeWheel()}
                onSpin={onSpin}
                onSpinComplete={onSpinComplete}
                lastRoll={lastRoll}
              />
              <div className="card placeholder-card">
                {report ? (
                  <button type="button" className="btn btn-primary" onClick={() => setShowReport(true)}>
                    查看人生反思報告
                  </button>
                ) : (
                  "轉動人生輪盤以抽取情境。"
                )}
              </div>
            </section>
          </div>
        </div>
        <div className="app-right map-panel">
          {mapError ? (
            <div className="map-placeholder">
              <p>請將地圖圖片放在 <code>public/city_updatedRoad.jpg</code></p>
              <p className="muted">然後重新整理頁面。</p>
            </div>
          ) : (
            <MapWithMarkers
              src={mapImg}
              alt="人生旅程地圖"
              progressIndex={pathIndex}
              markerSprite={markerSprite}
              onError={() => setMapError(true)}
            />
          )}
        </div>
      </div>

      {/* Mobile: full-screen map, wheel + ? icons fixed, horizontal scroll with arrow */}
      <div className="app-mobile">
        {/* Full-screen map: scroll left/right; first load shows left, arrow to right */}
        <div
          ref={mapScrollRef}
          className="mobile-map-fullscreen"
          role="region"
          aria-label="地圖"
        >
          <div className="mobile-map-scroll-inner">
            {mapError ? (
              <div className="map-placeholder map-placeholder-mobile map-placeholder-fullscreen">
                <p>請將地圖圖片放在 <code>public/city_updatedRoad.jpg</code></p>
              </div>
            ) : (
              <MapWithMarkers
                src={mapImg}
                alt="人生旅程地圖"
                progressIndex={pathIndex}
                markerSprite={markerSprite}
                onError={() => setMapError(true)}
              />
            )}
          </div>
          <button
            type="button"
            className="mobile-map-arrow mobile-map-arrow-right"
            onClick={scrollMapRight}
            aria-label="往右查看地圖"
          >
            →
          </button>
          <button
            type="button"
            className="mobile-map-arrow mobile-map-arrow-left"
            onClick={scrollMapLeft}
            aria-label="往左查看地圖"
          >
            ←
          </button>
        </div>

        {/* Fixed row: wheel icon + question mark (always visible) */}
        <div className="mobile-fixed-icons">
          <button
            type="button"
            className="mobile-icon-btn mobile-wheel-icon"
            onClick={() => {
              if (!showWheelOnMobile) setShowWheelOnMobile(true);
              setTimeout(
                () => document.querySelector<HTMLButtonElement>(".app-mobile .wheel-spin-btn")?.click(),
                showWheelOnMobile ? 0 : 250
              );
            }}
            aria-label="轉動人生輪盤"
          >
            <span className="mobile-wheel-icon-svg" aria-hidden>🎡</span>
          </button>
          <button
            type="button"
            className="mobile-icon-btn mobile-stats-btn"
            onClick={() => setShowStatsPanel(true)}
            aria-label="查看數值"
          >
            ?
          </button>
          {report && (
            <button
              type="button"
              className="mobile-icon-btn mobile-report-btn"
              onClick={() => setShowReport(true)}
              aria-label="人生反思報告"
            >
              報告
            </button>
          )}
        </div>

        {showWheelOnMobile && (
          <div className="mobile-wheel-overlay" role="dialog" aria-modal="true">
            <div className="mobile-wheel-section">
              <div className="wheel-wrap wheel-wrap-mobile">
                <LifeWheel
                  segments={uiManager.buildLifeWheel()}
                  onSpin={onSpin}
                  onSpinComplete={() => {
                    onSpinComplete();
                    setShowWheelOnMobile(false);
                  }}
                  lastRoll={lastRoll}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom blue bar: title + welcome line (follow current design) */}
        <footer className="mobile-bottom-topic">
          <h2 className="mobile-bottom-topic-title">人生旅程：數位人生</h2>
          <p className="mobile-bottom-topic-subtitle">
            {profile?.name ? `${profile.name} · ` : ""}
            歡迎進入【未來軌跡】—— 走下去，才知道終點在哪裡。
          </p>
        </footer>

        {floatingDeltas && (
          <div className="floating-deltas floating-deltas-mobile" role="status" aria-live="polite">
            {floatingDeltas.money !== undefined && floatingDeltas.money !== 0 && (
              <span className="floating-delta floating-delta-money">
                {floatingDeltas.money > 0 ? "+" : ""}{floatingDeltas.money} 金錢
              </span>
            )}
            {floatingDeltas.stress !== undefined && floatingDeltas.stress !== 0 && (
              <span className="floating-delta floating-delta-stress">
                {floatingDeltas.stress > 0 ? "+" : ""}{floatingDeltas.stress} 壓力
              </span>
            )}
            {floatingDeltas.happiness !== undefined && floatingDeltas.happiness !== 0 && (
              <span className="floating-delta floating-delta-happiness">
                {floatingDeltas.happiness > 0 ? "+" : ""}{floatingDeltas.happiness} 幸福感
              </span>
            )}
          </div>
        )}
      </div>

      {showStatsPanel && (
        <div
          className="mobile-stats-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="數值報告"
          onClick={() => setShowStatsPanel(false)}
        >
          <div className="mobile-stats-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-stats-panel-header">
              <h3>數值報告</h3>
              <button type="button" className="mobile-stats-close" onClick={() => setShowStatsPanel(false)} aria-label="關閉">
                ×
              </button>
            </div>
            <div className="mobile-stats-grid">
              <div className="mobile-stats-row"><span>智力</span><span>{snapshot.attributes.I}</span></div>
              <div className="mobile-stats-row"><span>體能</span><span>{snapshot.attributes.R}</span></div>
              <div className="mobile-stats-row"><span>靈感</span><span>{snapshot.attributes.A}</span></div>
              <div className="mobile-stats-row"><span>運氣</span><span>{snapshot.attributes.L}</span></div>
              <div className="mobile-stats-row"><span>金錢</span><span>{snapshot.lifeStatus.money}</span></div>
              <div className="mobile-stats-row"><span>壓力</span><span>{snapshot.lifeStatus.stress}</span></div>
              <div className="mobile-stats-row"><span>快樂</span><span>{snapshot.lifeStatus.happiness}</span></div>
              <div className="mobile-stats-row"><span>誠信</span><span>{snapshot.lifeStatus.integrity}</span></div>
            </div>
          </div>
        </div>
      )}

      {scenario && (
        <div className="scenario-popup-overlay" role="dialog" aria-modal="true" aria-labelledby="scenario-popup-title">
          <div className="scenario-popup-card">
            <ScenarioCard
              scenario={scenario}
              onPick={handleOptionPick}
              isOptionLocked={isOptionLocked}
              titleId="scenario-popup-title"
              speakerSprite={markerSprite}
              speakerName={
                profile?.gender === "女" ? "Girl" : profile?.gender === "男" ? "Boy" : profile?.gender ? "Bear" : "Player"
              }
            />
          </div>
        </div>
      )}

      {report && showReport && (
        <div className="report-popup-overlay" role="dialog" aria-modal="true" aria-labelledby="report-popup-title">
          <div className="report-popup-card">
            <ReflectionReport
              report={report}
              onClose={() => setShowReport(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
