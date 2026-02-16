import React, { useState } from "react";
import type {
  IntroProfile,
  IntroStats,
  CoreGoalId,
  IntroStatKey,
  BeliefFate,
  WhatMattersMost,
  SuperpowerChoice,
} from "../../engine/types";

const INITIAL_STATS: IntroStats = { Ambition: 0, Creativity: 0, Stability: 0 };

const CORE_GOALS: { id: CoreGoalId; label: string }[] = [
  { id: "money", label: "金錢" },
  { id: "fame", label: "名譽" },
  { id: "peace", label: "平靜" },
];

const FATE_OPTIONS: { id: BeliefFate; label: string }[] = [
  { id: "yes", label: "相信" },
  { id: "no", label: "不相信" },
  { id: "not_sure", label: "不確定" },
];

const WHAT_MATTERS_OPTIONS: { id: WhatMattersMost; label: string }[] = [
  { id: "love", label: "愛情" },
  { id: "career", label: "事業" },
  { id: "freedom", label: "自由" },
  { id: "family", label: "家庭" },
];

const SUPERPOWER_OPTIONS: { id: SuperpowerChoice; label: string }[] = [
  { id: "mind_reading", label: "讀心術" },
  { id: "time_travel", label: "時光旅行" },
  { id: "invisibility", label: "隱身" },
  { id: "healing", label: "治癒" },
];

function getSuggestedCareer(stats: IntroStats): string {
  const entries = Object.entries(stats) as [IntroStatKey, number][];
  const max = entries.reduce((best, [k, v]) => (v > best.value ? { key: k, value: v } : best), {
    key: "Stability" as IntroStatKey,
    value: -1,
  });
  switch (max.key) {
    case "Ambition":
      return "實習律師";
    case "Creativity":
      return "初級設計師";
    case "Stability":
      return "穩健職員";
    default:
      return "生涯探索者";
  }
}

export function IntroModule({ onComplete }: { onComplete: (profile: IntroProfile) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [beliefFate, setBeliefFate] = useState<BeliefFate | null>(null);
  const [whatMattersMost, setWhatMattersMost] = useState<WhatMattersMost | null>(null);
  const [superpower, setSuperpower] = useState<SuperpowerChoice | null>(null);
  const [coreGoal, setCoreGoal] = useState<CoreGoalId | null>(null);
  const [stats, setStats] = useState<IntroStats>({ ...INITIAL_STATS });

  const handleStart = () => {
    const profile: IntroProfile = {
      name,
      age,
      gender,
      ...(beliefFate != null && { beliefFate }),
      ...(whatMattersMost != null && { whatMattersMost }),
      ...(superpower != null && { superpower }),
      coreGoal: coreGoal ?? "peace",
      stats,
      suggestedCareer: getSuggestedCareer(stats),
    };
    onComplete(profile);
  };

  const canNext =
    step === 0
      ? name.trim().length > 0
      : step === 1
        ? beliefFate !== null
        : step === 2
          ? whatMattersMost !== null
          : step === 3
            ? superpower !== null
            : step === 4
              ? coreGoal !== null
              : true;

  return (
    <div className="intro-module">
      <div className="intro-card">
        {step === 0 && (
          <div className="intro-step">
            <h2>基本資料</h2>
            <label>
              你的名字
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入姓名"
                className="intro-input"
              />
            </label>
            <label>
              你的年齡
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="例如：25"
                className="intro-input"
              />
            </label>
            <div className="intro-gender-group">
              <div className="intro-gender-label">你的性別</div>
              <div className="intro-options">
                {["男", "女", "非二元／其他"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`btn option-btn ${gender === g ? "selected" : ""}`}
                    onClick={() => setGender(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="intro-step">
            <h2>信念</h2>
            <p className="intro-q">你相信命運可以被改變嗎？</p>
            <div className="intro-options">
              {FATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn option-btn ${beliefFate === opt.id ? "selected" : ""}`}
                  onClick={() => setBeliefFate(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="intro-step">
            <h2>價值觀</h2>
            <p className="intro-q">對你來說最重要的是什麼？</p>
            <div className="intro-options">
              {WHAT_MATTERS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn option-btn ${whatMattersMost === opt.id ? "selected" : ""}`}
                  onClick={() => setWhatMattersMost(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="intro-step">
            <h2>超能力</h2>
            <p className="intro-q">如果你能擁有一種超能力，你會選擇什麼？</p>
            <div className="intro-options">
              {SUPERPOWER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn option-btn ${superpower === opt.id ? "selected" : ""}`}
                  onClick={() => setSuperpower(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="intro-step">
            <h2>核心目標</h2>
            <p className="intro-q">你目前最在意的核心目標是？</p>
            <div className="intro-options">
              {CORE_GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`btn option-btn ${coreGoal === g.id ? "selected" : ""}`}
                  onClick={() => setCoreGoal(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="intro-step intro-result">
            <h2>測驗結果</h2>
            <div className="intro-stats">
              <div>成就抱負 (Ambition)：{stats.Ambition}</div>
              <div>創新思維 (Creativity)：{stats.Creativity}</div>
              <div>穩定安全 (Stability)：{stats.Stability}</div>
            </div>
            <button type="button" className="btn btn-primary intro-start-btn" onClick={handleStart}>
              開始遊戲
            </button>
          </div>
        )}

        {step < 5 && (
          <div className="intro-nav">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              上一題
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
            >
              下一題
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
