import React from "react";
import { Scenario, ScenarioOption } from "../../engine/types";

export function ScenarioCard({
  scenario,
  onPick,
  isOptionLocked,
  titleId,
}: {
  scenario: Scenario;
  onPick: (optionId: ScenarioOption["id"]) => void;
  isOptionLocked: (option: ScenarioOption) => boolean;
  titleId?: string;
}) {
  return (
    <div className="card scenario-card">
      <h2 id={titleId}>{scenario.title}</h2>
      <p className="muted">{scenario.description}</p>
      <div className="option-grid">
        {scenario.options.map((option) => {
          const locked = isOptionLocked(option);
          return (
            <button
              key={option.id}
              className="btn option-btn"
              disabled={locked}
              onClick={() => onPick(option.id)}
            >
              <span className="option-id">{option.id}</span>
              <span>{option.label}</span>
              {locked && <span className="option-lock">未解鎖</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
