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
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "not_sure", label: "Not sure" },
];

const WHAT_MATTERS_OPTIONS: { id: WhatMattersMost; label: string }[] = [
  { id: "love", label: "Love" },
  { id: "career", label: "Career" },
  { id: "freedom", label: "Freedom" },
  { id: "family", label: "Family" },
];

const SUPERPOWER_OPTIONS: { id: SuperpowerChoice; label: string }[] = [
  { id: "mind_reading", label: "Mind reading" },
  { id: "time_travel", label: "Time travel" },
  { id: "invisibility", label: "Invisibility" },
  { id: "healing", label: "Healing" },
];

const QUESTIONS: {
  title: string;
  options: { id: "A" | "B" | "C"; label: string; stat: IntroStatKey }[];
}[] = [
  {
    title: "在一個重要的專案中，你發現原本的方法行不通，截止日期只剩兩天，你會怎麼做？",
    options: [
      {
        id: "A",
        label: "沒日沒夜地加班，嘗試所有可能的邏輯方案，一定要達成目標。",
        stat: "Ambition",
      },
      {
        id: "B",
        label: "嘗試一種完全沒人試過的「偏門」方法，看看能不能反敗為勝。",
        stat: "Creativity",
      },
      {
        id: "C",
        label: "向上司報告現狀，請求按照公司既定程序延期或尋求標準支援。",
        stat: "Stability",
      },
    ],
  },
  {
    title: "如果你可以自由選擇工作環境，你最希望待在哪種辦公室？",
    options: [
      {
        id: "A",
        label: "位於市中心最高層的大樓，擁有個人專屬辦公室與廣闊視野。",
        stat: "Ambition",
      },
      {
        id: "B",
        label: "一個裝潢奇特、充滿藝術感且沒有固定座位的工作空間。",
        stat: "Creativity",
      },
      {
        id: "C",
        label: "在離家近、環境熟悉且有長期合作默契的溫馨團隊中工作。",
        stat: "Stability",
      },
    ],
  },
  {
    title: "假設你在遊戲中獲得了一筆意外的「啟動資金」，你會如何運用？",
    options: [
      {
        id: "A",
        label: "全部投入利潤最高但也最冒險的投資項目，想快速翻倍。",
        stat: "Ambition",
      },
      {
        id: "B",
        label: "用來購買稀有的研發器材或學習一門全新的藝術技能。",
        stat: "Creativity",
      },
      {
        id: "C",
        label: "存入銀行賺取固定利息，或購買低風險的長期保險。",
        stat: "Stability",
      },
    ],
  },
  {
    title: "當你退休時，你最希望在報紙上看到關於你的哪種評價？",
    options: [
      {
        id: "A",
        label: "「他是一位白手起家、建立了龐大商業帝國的領袖。」",
        stat: "Ambition",
      },
      {
        id: "B",
        label: "「他改變了人們看世界的方式，留下無數前衛的作品。」",
        stat: "Creativity",
      },
      {
        id: "C",
        label: "「他一生生活穩健，是家人最可靠的支柱，受人尊敬。」",
        stat: "Stability",
      },
    ],
  },
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

  const addStat = (key: IntroStatKey) => {
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
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
        <h1 className="intro-title">遊戲開場心理測驗</h1>
        <p className="intro-desc">
          為了配合生涯規劃核心指標：<strong>成就抱負 (Ambition)</strong>、<strong>創新思維 (Creativity)</strong> 與 <strong>穩定安全 (Stability)</strong>，請依序回答以下問題。
        </p>

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
            <h2>Belief</h2>
            <p className="intro-q">Do you believe fate can be changed?</p>
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
            <h2>Priorities</h2>
            <p className="intro-q">What matters most to you?</p>
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
            <h2>Superpower</h2>
            <p className="intro-q">If you could have one superpower, what would it be?</p>
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

        {step >= 5 && step <= 8 && (
          <div className="intro-step">
            <h2>問題 {step - 4}</h2>
            <p className="intro-q">{QUESTIONS[step - 5].title}</p>
            <div className="intro-options">
              {QUESTIONS[step - 5].options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="btn option-btn"
                  onClick={() => {
                    addStat(opt.stat);
                    setStep(step + 1);
                  }}
                >
                  <span className="option-id">{opt.id}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="intro-step intro-result">
            <h2>測驗結果</h2>
            <div className="intro-stats">
              <div>成就抱負 (Ambition)：{stats.Ambition}</div>
              <div>創新思維 (Creativity)：{stats.Creativity}</div>
              <div>穩定安全 (Stability)：{stats.Stability}</div>
            </div>
            <p className="intro-suggestion">
              根據你的回答，我們建議的初始職業方向為：<strong>{getSuggestedCareer(stats)}</strong>
            </p>
            <button type="button" className="btn btn-primary intro-start-btn" onClick={handleStart}>
              開始遊戲
            </button>
          </div>
        )}

        {step < 9 && step !== 5 && step !== 6 && step !== 7 && step !== 8 && (
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
