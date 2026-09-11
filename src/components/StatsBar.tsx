import React from 'react';
import { StatsSummary, StreamDataPoint } from '../types.ts';
import { ShieldAlert, AlertTriangle, Activity, Database, CheckCircle2, Clock } from 'lucide-react';

interface StatsBarProps {
  stats: StatsSummary;
  currentPoint: StreamDataPoint | null;
  totalPoints: number;
  currentIndex: number;
  isStreaming: boolean;
  speed: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  currentPoint,
  totalPoints,
  currentIndex,
  isStreaming,
  speed,
}) => {
  const zScore = currentPoint?.zScore ?? 0;
  const isAnomaly = currentPoint?.isAnomaly ?? false;

  const zScoreColor =
    zScore >= 2.5
      ? 'text-rose-400 bg-rose-950/60 border-rose-800'
      : zScore >= 1.5
      ? 'text-amber-400 bg-amber-950/50 border-amber-800/60'
      : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';

  return (
    <div id="stats-bar" className="w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Total Alerts & Severity Breakdown */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <span className="text-slate-400 font-medium tracking-wide uppercase text-[11px]">Alerts Total:</span>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-sm bg-slate-800 text-slate-100 border border-slate-700">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Critical */}
            <div
              id="stat-critical"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300"
              title="Critical Severity (Z-Score > 15 or severe spike)"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="font-semibold">Critical:</span>
              <span className="font-mono font-bold">{stats.critical}</span>
            </div>

            {/* High */}
            <div
              id="stat-high"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-950/40 border border-orange-900/60 text-orange-300"
              title="High Severity"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="font-semibold">High:</span>
              <span className="font-mono font-bold">{stats.high}</span>
            </div>

            {/* Medium */}
            <div
              id="stat-medium"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-900/60 text-amber-300"
              title="Medium Severity"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-semibold">Med:</span>
              <span className="font-mono font-bold">{stats.medium}</span>
            </div>

            {/* Low */}
            <div
              id="stat-low"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-900/60 text-emerald-300"
              title="Low Severity"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold">Low:</span>
              <span className="font-mono font-bold">{stats.low}</span>
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry & Dataset Stream Status */}
        <div className="flex items-center flex-wrap gap-3 font-mono">
          {/* Current Value */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/80 text-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">Requests:</span>
            <span className="font-bold text-cyan-300">
              {currentPoint ? `${currentPoint.value.toFixed(1)} req/interval` : '--'}
            </span>
          </div>

          {/* Rolling Mean */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/80 text-slate-200">
            <span className="text-slate-400 text-[11px]">30pt Mean:</span>
            <span className="font-medium text-slate-300">
              {currentPoint ? `${currentPoint.mean.toFixed(1)} req/interval` : '--'}
            </span>
          </div>

          {/* Z-Score */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${zScoreColor}`}>
            <span className="text-[11px] font-semibold">Z-Score:</span>
            <span className="font-bold">
              {currentPoint ? `${zScore >= 0 ? '+' : ''}${zScore.toFixed(2)}σ` : '0.00σ'}
            </span>
            {isAnomaly && (
              <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1 rounded bg-rose-500 text-white">
                ANOMALY
              </span>
            )}
          </div>

          {/* Dataset Row Tracker */}
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
            <Database className="w-3 h-3 text-slate-400" />
            <span>Row:</span>
            <span className="text-slate-200 font-semibold">{currentIndex + 1}</span>
            <span>/</span>
            <span>{totalPoints || 4032}</span>
            <span className="text-slate-500">({speed}x)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
