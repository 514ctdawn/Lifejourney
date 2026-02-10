import React, { useMemo, useRef, useState } from "react";
import { GameEngine } from "../../engine/gameEngine";
import { DreamCard, Scenario, ScenarioOption } from "../../engine/types";
import { UIManager } from "../uiManager";
import { HudBars } from "./HudBars";
import { LifeWheel } from "./LifeWheel";
import { MapWithMarkers } from "./MapWithMarkers";
import { ScenarioCard } from "./ScenarioCard";
import { ReflectionReport } from "./ReflectionReport";

const DREAM_CARDS: DreamCard[] = [
  { id: "surgeon", label: "頂級外科醫生", primaryRiasec: "I", secondaryRiasec: "S" },
  { id: "artist", label: "新銳藝術家", primaryRiasec: "A", secondaryRiasec: "S" },
  { id: "founder", label: "科技創業家", primaryRiasec: "E", secondaryRiasec: "I" },
];

type ReflectionReportData = {
  ending: { title: string; description: string };
  endingScore: number;
  riasecProfile: Record<string, number>;
  stageSummaries: Record<string, number>;
};

export function GameScreen() {
  const uiManager = useMemo(() => new UIManager(), []);
  const [dreamCard, setDreamCard] = useState<DreamCard>(DREAM_CARDS[0]);
  const engineRef = useRef<GameEngine | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [report, setReport] = useState<ReflectionReportData | null>(null);
  const [, setTick] = useState(0);
  const [mapError, setMapError] = useState(false);
  const mapSrc = "/life-map.png";

  const ensureEngine = () => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine(dreamCard);
    }
    return engineRef.current;
  };

  const startNewRun = (card: DreamCard) => {
    engineRef.current = new GameEngine(card);
    setScenario(engineRef.current.nextScenario() ?? null);
    setReport(null);
    setLastRoll(null);
    setTick((t) => t + 1);
  };

  const engine = ensureEngine();
  const snapshot = engine.snapshot;
  const mood = uiManager.getMood(snapshot);

  const onSpin = () => {
    const roll = engine.spinLifeWheel();
    setLastRoll(roll);
    if (!scenario) {
      setScenario(engine.nextScenario() ?? null);
    }
    return roll;
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
    engine.resolveScenario(scenario.id, optionId);
    const next = engine.nextScenario() ?? null;
    setScenario(next);
    setTick((t) => t + 1);
    if (engine.snapshot.turnsRemaining === 0) {
      setReport(engine.generateLifeReflectionReport());
    }
  };

  return (
    <div className={`app-shell mood-${mood}`}>
      <div className="app-left">
        <header className="app-header">
          <div>
            <h1>Life Journey: Digital Life</h1>
            <p className="muted">Nintendo Switch-inspired life simulation</p>
          </div>
          <div className="dream-card">
            <label>Dream Card</label>
            <select
              value={dreamCard.id}
              onChange={(event) => {
                const card = DREAM_CARDS.find((c) => c.id === event.target.value) ?? DREAM_CARDS[0];
                setDreamCard(card);
                startNewRun(card);
              }}
            >
              {DREAM_CARDS.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.label}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={() => startNewRun(dreamCard)}>
              Restart
            </button>
          </div>
        </header>

        <div className="app-left-scroll">
          <section className="hud-section">
            <HudBars bars={uiManager.getHudBars(snapshot)} />
            <div className="status-panel">
              <div>Stage: {snapshot.stage}</div>
              <div>Turns: {snapshot.turnsRemaining}</div>
              <div>Consistency: {snapshot.hidden.consistencyScore}</div>
              <div>Scandal: {snapshot.hidden.scandalValue}</div>
            </div>
          </section>

          <section className="main-grid">
            <LifeWheel
              segments={uiManager.buildLifeWheel()}
              onSpin={onSpin}
              lastRoll={lastRoll}
            />
            {report ? (
              <ReflectionReport report={report} />
            ) : (
              <div className="card placeholder-card">Spin the Life Wheel to draw a scenario.</div>
            )}
          </section>
        </div>
      </div>

      {scenario && (
        <div className="scenario-popup-overlay" role="dialog" aria-modal="true" aria-labelledby="scenario-popup-title">
          <div className="scenario-popup-card">
            <ScenarioCard
              scenario={scenario}
              onPick={handleOptionPick}
              isOptionLocked={isOptionLocked}
              titleId="scenario-popup-title"
            />
          </div>
        </div>
      )}

      <div className="app-right map-panel">
        {mapError ? (
          <div className="map-placeholder">
            <p>Place your board map image at <code>public/life-map.png</code></p>
            <p className="muted">Then refresh the page.</p>
          </div>
        ) : (
          <MapWithMarkers
            src={mapSrc}
            alt="Life journey board map"
            onError={() => setMapError(true)}
          />
        )}
      </div>
    </div>
  );
}
