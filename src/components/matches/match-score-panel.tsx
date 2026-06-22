import type { MatchScores } from "./match.types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const score = clampScore(value);

  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function MatchScorePanel({ scores }: { scores: MatchScores }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">Compatibility snapshot</h2>
          <p className="mt-1 text-sm text-slate-500">Scores are saved from the moment the match was created.</p>
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Overall</p>
          <p className="text-2xl font-semibold text-teal-900">{clampScore(scores.compatibilityScore)}%</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ScoreRow label="Skills" value={scores.skillsScore} />
        <ScoreRow label="Founder vision" value={scores.founderVisionScore} />
        <ScoreRow label="Location" value={scores.locationScore} />
        <ScoreRow label="Consistency" value={scores.consistencyScore} />
        <ScoreRow label="Trust" value={scores.trustScore} />
        <ScoreRow label="Builder" value={scores.builderScore} />
      </div>
    </section>
  );
}
