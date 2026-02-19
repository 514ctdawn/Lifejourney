import React, { useEffect, useRef, useState } from "react";
import { Scenario, ScenarioOption } from "../../engine/types";

export function ScenarioCard({
  scenario,
  onPick,
  isOptionLocked,
  titleId,
  speakerSprite,
  speakerName,
}: {
  scenario: Scenario;
  onPick: (optionId: ScenarioOption["id"]) => void;
  isOptionLocked: (option: ScenarioOption) => boolean;
  titleId?: string;
  speakerSprite?: string;
  speakerName?: string;
}) {
  const [visibleText, setVisibleText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const full = scenario.description ?? "";
    setVisibleText("");
    setIsTyping(true);
    let index = 0;
    let cancelled = false;

    const playPip = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 850;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        osc.start(now);
        osc.stop(now + 0.05);
      } catch {
        // ignore audio errors (e.g. autoplay policies)
      }
    };

    const step = () => {
      if (cancelled || index >= full.length) {
        setIsTyping(false);
        return;
      }
      const ch = full[index];
      setVisibleText((prev) => prev + ch);
      index += 1;
      if (ch.trim()) {
        playPip();
      }
      if (index < full.length) {
        let delay = 60;
        if (ch === "，" || ch === "," || ch === "、") delay = 150;
        if (ch === "。" || ch === "." || ch === "！" || ch === "？" || ch === "!" || ch === "?") delay = 220;
        if (ch === " ") delay = 35;
        timer = window.setTimeout(step, delay);
      } else {
        setIsTyping(false);
      }
    };

    let timer = window.setTimeout(step, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [scenario.id, scenario.description]);

  return (
    <div className="card scenario-card scenario-panel">
      <div className="scenario-name-tag">{speakerName ?? "玩家"}</div>
      <div className="scenario-header-row">
        {speakerSprite && (
          <div className="scenario-portrait">
            <img src={speakerSprite} alt={speakerName ?? "角色"} />
          </div>
        )}
        <div className="scenario-text-block">
          <h2 id={titleId} className="scenario-title">
            {scenario.title}
          </h2>
          <p className="scenario-description">
            {visibleText}
            {isTyping && <span className="scenario-caret">▋</span>}
            {!isTyping && <span className="scenario-next-indicator-inline">▼</span>}
          </p>
        </div>
      </div>
      <div className={`option-grid ${isTyping ? "option-grid-typing" : ""}`}>
        {scenario.options.map((option) => {
          const locked = isOptionLocked(option);
          return (
            <button
              key={option.id}
              className="btn option-btn"
              disabled={locked || isTyping}
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
