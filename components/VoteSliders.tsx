'use client';

import { useState } from 'react';
import ScoringGuide from './ScoringGuide';

const COLORS = {
  exec: '#2ec4b6',
  info: '#ef767a',
  mental: '#7d53de',
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, exec, info, mental }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Vote failed (${res.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl glass-card p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-rajdhani)] text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Rate this game
          </h3>
          <p className="text-xs text-text-muted mt-1">Drag sliders to assign scores from 0 to 100</p>
        </div>
        <ScoringGuide />
      </div>

      <div className="space-y-6">
        <Slider label="Execution" value={exec} color={COLORS.exec} onChange={setExec} disabled={submitted} />
        <Slider label="Information" value={info} color={COLORS.info} onChange={setInfo} disabled={submitted} />
        <Slider label="Mental" value={mental} color={COLORS.mental} onChange={setMental} disabled={submitted} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || submitted}
        className="relative w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 overflow-hidden group disabled:cursor-not-allowed"
        style={{
          background: submitted
            ? 'rgba(46, 196, 182, 0.1)'
            : saving
              ? 'rgba(239, 118, 122, 0.1)'
              : 'linear-gradient(135deg, rgba(46, 196, 182, 0.15), rgba(125, 83, 222, 0.15))',
          border: submitted
            ? '1px solid rgba(46, 196, 182, 0.3)'
            : '1px solid rgba(253,255,252,0.1)',
          color: submitted ? '#2ec4b6' : saving ? '#ef767a' : '#fdfffc',
        }}
      >
        {/* Button hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-accent-sea/10 via-accent-purple/10 to-accent-sea/10" />

        <span className="relative flex items-center justify-center gap-2">
          {submitted ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Vote Submitted
            </>
          ) : saving ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Vote'
          )}
        </span>
      </button>

      {submitted ? (
        <div className="flex items-center gap-2 text-xs text-accent-coral animate-fade-in">
          <span className="h-1 w-1 rounded-full bg-accent-coral animate-pulse" />
          Refresh the page to see updated averages
        </div>
      ) : null}
      {error ? (
        <div className="flex items-center gap-2 text-xs text-accent-coral animate-fade-in">
          <span className="h-1 w-1 rounded-full bg-accent-coral animate-pulse" />
          {error}
        </div>
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
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
          />
          <span className="text-sm font-medium text-text-primary">{label}</span>
        </div>
        <span
          className="tabular-nums text-sm font-bold font-[family-name:var(--font-rajdhani)]"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <div className="relative">
        <input
          aria-label={label}
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            accentColor: color,
            background: `linear-gradient(to right, ${color}40 0%, ${color}40 ${value}%, rgba(253,255,252,0.05) ${value}%, rgba(253,255,252,0.05) 100%)`,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-text-muted uppercase tracking-wider">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
