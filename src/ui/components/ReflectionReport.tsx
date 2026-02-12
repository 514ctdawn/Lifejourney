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
  onClose,
}: {
  report: {
    ending: { title: string; description: string };
    endingScore: number;
    riasecProfile: Record<string, number>;
    stageSummaries: Record<string, number>;
    suggestedJobs: { title: string; description: string }[];
  };
  onClose?: () => void;
}) {
  return (
    <div className="card reflection-card">
      <div className="reflection-header">
        <h2>人生反思報告</h2>
        {onClose && (
          <button type="button" className="icon-button reflection-close" onClick={onClose} aria-label="關閉報告">
            ✕
          </button>
        )}
      </div>
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

      {report.suggestedJobs?.length > 0 && (
        <div className="career-suggestions">
          <h3>適性職涯建議</h3>
          <div className="career-card-grid">
            {report.suggestedJobs.slice(0, 6).map((job) => (
              <div key={job.title} className="career-card">
                <div className="career-card-title">{job.title}</div>
                <p className="career-card-desc">{job.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
