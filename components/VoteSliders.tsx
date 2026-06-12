'use client';

import { useState } from 'react';
import ScoringGuide from './ScoringGuide';

const COLORS = {
  exec: '#22d3ee',
  info: '#fbbf24',
  mental: '#e879f9',
};

export default function VoteSliders({
  slug,
  initialExec,
  initialInfo,
  initialMental,
}: {
  slug: string;
  initialExec: number;
  initialInfo: number;
  initialMental: number;
}) {
  const [exec, setExec] = useState(initialExec);
  const [info, setInfo] = useState(initialInfo);
  const [mental, setMental] = useState(initialMental);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, exec, info, mental }),
      });
      setSubmitted(true);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Rate this game
        </h3>
        <ScoringGuide />
      </div>

      <Slider label="Execution" value={exec} color={COLORS.exec} onChange={setExec} disabled={submitted} />
      <Slider label="Info" value={info} color={COLORS.info} onChange={setInfo} disabled={submitted} />
      <Slider label="Mental" value={mental} color={COLORS.mental} onChange={setMental} disabled={submitted} />

      <button
        onClick={handleSubmit}
        disabled={saving || submitted}
        className="mt-1 w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Submitting…' : submitted ? 'Vote submitted' : 'Submit Vote'}
      </button>

      {submitted ? (
        <p className="text-xs text-amber-400">
          Refresh the page to see updated averages.
        </p>
      ) : null}
    </div>
  );
}

function Slider({
  label,
  value,
  color,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current"
        style={{ accentColor: color }}
      />
    </div>
  );
}
