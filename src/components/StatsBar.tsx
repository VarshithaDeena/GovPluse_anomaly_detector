import React from 'react';
import { StatsSummary, StreamDataPoint } from '../types.ts';
import { Activity, Database, Clock, Zap } from 'lucide-react';
import { formatTimeHHMMSS } from '../utils/formatters.ts';

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
  speed,
}) => {
  const zScore = currentPoint?.zScore ?? 0;
  const isAnomaly = currentPoint?.isAnomaly ?? false;

  // Calculate synthetic ELB round-trip latency correlated with request surge load
  // Normal baseline ~38-42ms, scaling up to 99ms+ under 380+ req/min spike
  const computedLatencyMs = currentPoint
    ? Math.round(38 + Math.min(65, (currentPoint.value / 380) * 61))
    : 42;

  const zScoreColor =
    zScore >= 2.5
      ? 'text-rose-400 bg-rose-950/70 border-rose-700/80 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
      : zScore >= 1.5
      ? 'text-amber-400 bg-amber-950/60 border-amber-700/70'
      : 'text-emerald-400 bg-emerald-950/50 border-emerald-700/60';

  return (
    <div id="stats-bar" className="w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Total Alerts & Severity Breakdown */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <span className="text-slate-400 font-bold tracking-wider uppercase text-[11px]">Alerts Total:</span>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-sm bg-slate-800 text-slate-100 border border-slate-700 shadow-inner">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            {/* Critical */}
            <div
              id="stat-critical"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/70 border border-rose-700/80 text-rose-200"
              title="Critical Severity (Z-Score > 5σ or severe spike)"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="font-bold text-[10px] tracking-wide uppercase">CRITICAL:</span>
              <span className="font-mono font-extrabold">{stats.critical}</span>
            </div>

            {/* High */}
            <div
              id="stat-high"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-950/60 border border-orange-700/80 text-orange-200"
              title="High Severity"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="font-bold text-[10px] tracking-wide uppercase">HIGH:</span>
              <span className="font-mono font-extrabold">{stats.high}</span>
            </div>

            {/* Medium */}
            <div
              id="stat-medium"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-700/80 text-amber-200"
              title="Medium Severity"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-bold text-[10px] tracking-wide uppercase">MEDIUM:</span>
              <span className="font-mono font-extrabold">{stats.medium}</span>
            </div>

            {/* Low */}
            <div
              id="stat-low"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-700/80 text-emerald-200"
              title="Low / Info Severity"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-[10px] tracking-wide uppercase">INFO:</span>
              <span className="font-mono font-extrabold">{stats.low}</span>
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry with Explicit Units */}
        <div className="flex items-center flex-wrap gap-2.5 font-mono">
          {/* Current Request Rate */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Traffic:</span>
            <span className="font-bold text-cyan-300">
              {currentPoint ? `${currentPoint.value.toFixed(1)} req/min` : '-- req/min'}
            </span>
          </div>

          {/* Latency metric with explicit ms unit */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">ELB Latency:</span>
            <span className={`font-bold ${computedLatencyMs > 75 ? 'text-rose-400' : 'text-slate-200'}`}>
              {computedLatencyMs} ms
            </span>
          </div>

          {/* Rolling Mean with explicit req/min */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-slate-200">
            <span className="text-slate-400 text-[11px]">30pt Mean:</span>
            <span className="font-medium text-slate-300">
              {currentPoint ? `${currentPoint.mean.toFixed(1)} req/min` : '-- req/min'}
            </span>
          </div>

          {/* Z-Score with explicit σ unit */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${zScoreColor}`}>
            <span className="text-[11px] font-bold">Z-Score:</span>
            <span className="font-mono font-extrabold tracking-tight">
              {currentPoint ? `${zScore >= 0 ? '+' : ''}${zScore.toFixed(2)}σ` : '0.00σ'}
            </span>
            {isAnomaly && (
              <span className="ml-1 text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-rose-600 text-white animate-pulse">
                SPIKE
              </span>
            )}
          </div>

          {/* Timestamp with explicit HH:MM:SS */}
          {currentPoint && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[11px] bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Time:</span>
              <span className="text-slate-200 font-bold">{formatTimeHHMMSS(currentPoint.timestamp)}</span>
            </div>
          )}

          {/* Dataset Row Tracker */}
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
            <Database className="w-3 h-3 text-slate-500" />
            <span>Row:</span>
            <span className="text-slate-200 font-semibold">{currentIndex + 1}</span>
            <span>/</span>
            <span>{totalPoints || 4032}</span>
            <span className="text-cyan-400 font-semibold">({speed}x)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
