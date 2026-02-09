import React from "react";

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
      <h2>Life Reflection Report</h2>
      <div className="ending-block">
        <h3>{report.ending.title}</h3>
        <p>{report.ending.description}</p>
        <div className="badge">Ending Score: {report.endingScore}</div>
      </div>
      <div className="riasec">
        {Object.entries(report.riasecProfile).map(([key, value]) => (
          <div key={key} className="riasec-item">
            <span>{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="stage-summary">
        {Object.entries(report.stageSummaries).map(([stage, count]) => (
          <div key={stage} className="stage-chip">
            Stage {stage}: {count}
          </div>
        ))}
      </div>
    </div>
  );
}
