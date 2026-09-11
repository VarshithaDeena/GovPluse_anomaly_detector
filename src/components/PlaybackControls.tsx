import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FastForward,
  Flame,
  Gauge,
  Sliders,
  Clock,
  Zap,
} from 'lucide-react';
import { formatTimeHHMMSS } from '../utils/formatters.ts';

interface PlaybackControlsProps {
  isStreaming: boolean;
  onToggleStreaming: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentIndex: number;
  totalPoints: number;
  onSeek: (index: number) => void;
  onStepForward: () => void;
  onJumpToIncident: () => void;
  onReset: () => void;
  thresholdZ: number;
  onThresholdChange: (z: number) => void;
  currentTimestamp?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isStreaming,
  onToggleStreaming,
  speed,
  onSpeedChange,
  currentIndex,
  totalPoints,
  onSeek,
  onStepForward,
  onJumpToIncident,
  onReset,
  thresholdZ,
  onThresholdChange,
  currentTimestamp,
}) => {
  const speeds = [0.5, 1, 2, 5];
  const progressPercent = totalPoints > 0 ? (((currentIndex + 1) / totalPoints) * 100).toFixed(1) : '0.0';

  return (
    <div
      id="playback-controls"
      className="w-full bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-4"
    >
      {/* Top Deck: Grouped Playback Modules */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        {/* Module 1: Replay Engine Controls (Cols 1-4) */}
        <div className="md:col-span-4 bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sliders className="w-3 h-3 text-cyan-400" />
              Replay Engine
            </span>
            <span className={isStreaming ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isStreaming ? '● LIVE REPLAY' : '❚❚ PAUSED'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Play / Pause Toggle */}
            <button
              id="play-pause-btn"
              onClick={onToggleStreaming}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-bold text-xs transition shadow-md ${
                isStreaming
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40 border border-amber-500/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40 border border-cyan-500/50'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Stream</span>
                </>
              )}
            </button>

            {/* Step Forward 1 Point */}
            <button
              id="step-btn"
              onClick={onStepForward}
              disabled={isStreaming}
              className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-md text-xs font-mono border transition ${
                isStreaming
                  ? 'opacity-35 cursor-not-allowed bg-slate-800/40 text-slate-500 border-slate-800'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
              }`}
              title="Step +1 data point forward (when paused)"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>+1</span>
            </button>

            {/* Reset to Start */}
            <button
              id="reset-btn"
              onClick={onReset}
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
              title="Reset feed to Row 1 (2014-04-10)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Module 2: Speed Multiplier & Threshold Sensitivity (Cols 5-7) */}
        <div className="md:col-span-3 bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <FastForward className="w-3 h-3 text-cyan-400" />
              Replay Speed
            </span>
            <span className="text-cyan-300 font-bold">{speed}x Multiplier</span>
          </div>

          <div className="flex items-center bg-slate-900 p-0.5 rounded-md border border-slate-800">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`flex-1 py-1 rounded text-[11px] font-mono font-bold transition text-center ${
                  speed === s
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Module 3: Anomaly Sensitivity Threshold (Cols 8-9) */}
        <div className="md:col-span-2 bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Gauge className="w-3 h-3 text-amber-400" />
              Sensitivity
            </span>
            <span className="text-amber-400 font-bold">+{thresholdZ.toFixed(1)}σ</span>
          </div>

          <div className="relative">
            <select
              value={thresholdZ}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="w-full bg-slate-900 text-cyan-200 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="2.0">2.0σ (Sensitive)</option>
              <option value="2.5">2.5σ (Standard)</option>
              <option value="3.0">3.0σ (Strict)</option>
              <option value="3.5">3.5σ (Extreme)</option>
            </select>
          </div>
        </div>

        {/* Module 4: Primary Demo CTA ("Jump to Traffic Surge Incident") (Cols 10-12) */}
        <div className="md:col-span-3 bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-slate-950/80 border border-amber-600/70 rounded-lg p-2.5 flex flex-col justify-between gap-2 shadow-lg shadow-amber-950/40">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono font-extrabold tracking-wider text-amber-300 border-b border-amber-800/60 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              Primary Demo Target
            </span>
            <span className="text-amber-200 font-bold">Row 792</span>
          </div>

          {/* Glowing Animated CTA Button */}
          <button
            id="jump-incident-btn"
            onClick={onJumpToIncident}
            className="group relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md font-mono text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.55)] transition-all transform active:scale-95 animate-pulse"
            title="Advance timeline to authentic traffic surge spike (Row 792 / 381 req/min)"
          >
            <Flame className="w-4 h-4 text-slate-950 fill-current animate-bounce" />
            <span>Jump to Traffic Surge</span>
          </button>
        </div>
      </div>

      {/* Bottom Deck: Timeline Scrubber with Explicit Micro-Labels & Units */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              TIMELINE SCRUBBER:
            </span>
            <span className="text-slate-200 font-bold">
              Row {currentIndex + 1} of {totalPoints || 4032}
            </span>
            <span className="text-cyan-400 font-semibold">({progressPercent}%)</span>
          </div>

          {currentTimestamp && (
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-500 text-[10px]">TIME (HH:MM:SS):</span>
              <span className="font-bold text-cyan-300">{formatTimeHHMMSS(currentTimestamp)}</span>
              <span className="text-slate-500 text-[10px]">({currentTimestamp.split(' ')[0]})</span>
            </div>
          )}
        </div>

        <div className="relative flex items-center w-full py-1">
          <input
            id="timeline-scrubber"
            type="range"
            min="0"
            max={Math.max(0, totalPoints - 1)}
            value={currentIndex}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition"
          />

          {/* Incident marker flag on scrubber at row 792 */}
          {totalPoints > 0 && (
            <div
              className="absolute -top-1 bottom-0 w-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.9)] pointer-events-none"
              style={{ left: `${(792 / totalPoints) * 100}%` }}
              title="AWS ELB Traffic Surge Incident (Row 792: 381 req/min)"
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Row 1 (2014-04-10 00:04:00)</span>
          <span className="text-amber-400/90 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            Row 792: Peak Traffic Surge Incident (381 req/min)
          </span>
          <span>Row {totalPoints || 4032} (2014-04-24)</span>
        </div>
      </div>
    </div>
  );
};
