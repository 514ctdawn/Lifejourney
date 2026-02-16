import React from "react";

const MAX_MONEY_FOR_BAR = 1000;

function pct(value: number, max: number = 100): number {
  return Math.max(0, Math.min(max, value));
}

function moneyPct(money: number): number {
  return pct((money / MAX_MONEY_FOR_BAR) * 100, 100);
}

export function StatsHistogram({
  money,
  stress,
  happiness,
}: {
  money: number;
  stress: number;
  happiness: number;
}) {
  const moneyPctVal = moneyPct(money);
  const stressPct = pct(stress);
  const happinessPct = pct(happiness);

  return (
    <div className="stats-histogram" role="img" aria-label="金錢、壓力、幸福感">
      <div className="stats-histogram-inner">
        <div className="stats-histogram-bar-wrap" title={`金錢 ${money}`}>
          <div
            className="stats-histogram-bar stats-bar-money"
            style={{ height: `${moneyPctVal}%` }}
            aria-hidden
          />
        </div>
        <div className="stats-histogram-bar-wrap" title={`壓力 ${stress}`}>
          <div
            className="stats-histogram-bar stats-bar-stress"
            style={{ height: `${stressPct}%` }}
            aria-hidden
          />
        </div>
        <div className="stats-histogram-bar-wrap" title={`幸福感 ${happiness}`}>
          <div
            className="stats-histogram-bar stats-bar-happiness"
            style={{ height: `${happinessPct}%` }}
            aria-hidden
          />
        </div>
      </div>
      <div className="stats-histogram-labels">
        <span className="stats-label">金錢</span>
        <span className="stats-label">壓力</span>
        <span className="stats-label">幸福感</span>
      </div>
    </div>
  );
}
