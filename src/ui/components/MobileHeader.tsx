import React from "react";
import { StatsHistogram } from "./StatsHistogram";

export function MobileHeader({
  money,
  stress,
  happiness,
}: {
  money: number;
  stress: number;
  happiness: number;
}) {
  return (
    <header className="mobile-header" role="banner">
      <h1 className="mobile-header-title">歡迎來到【未來軌跡】</h1>
      <p className="mobile-header-subtitle">走下去，才知道終點在哪裡。</p>
      <StatsHistogram money={money} stress={stress} happiness={happiness} />
    </header>
  );
}
