import React from "react";

const RIASEC_LABELS: Record<string, string> = {
  R: "實作型",
  I: "研究型",
  A: "藝術型",
  S: "社會型",
  E: "企業型",
  C: "常規型",
};

export function ReflectionReport({
  report,
}: {
  report: {
    ending: { title: string; description: string };
    endingScore: number;
    riasecProfile: Record<string, number>;
    stageSummaries: Record<string, number>;
  };
}) {
  return (
    <div className="card reflection-card">
      <h2>人生反思報告</h2>
      <div className="ending-block">
        <h3>{report.ending.title}</h3>
        <p>{report.ending.description}</p>
        <div className="badge">結局分數：{report.endingScore}</div>
      </div>
      <div className="riasec">
        {Object.entries(report.riasecProfile).map(([key, value]) => (
          <div key={key} className="riasec-item">
            <span>{RIASEC_LABELS[key] ?? key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="stage-summary">
        {Object.entries(report.stageSummaries).map(([stage, count]) => (
          <div key={stage} className="stage-chip">
            階段 {stage}：{count}
          </div>
        ))}
      </div>
    </div>
  );
}
