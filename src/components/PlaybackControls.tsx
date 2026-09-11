import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FastForward,
  Flame,
  Sliders,
  AlertCircle,
  Gauge,
} from 'lucide-react';

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

  return (
    <div id="playback-controls" className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Play/Pause & Speed Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Main Play / Pause Button */}
          <button
            id="play-pause-btn"
            onClick={onToggleStreaming}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition shadow-lg ${
              isStreaming
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Replay</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Feed</span>
              </>
            )}
          </button>

          {/* Step Forward 1 Point */}
          <button
            id="step-btn"
            onClick={onStepForward}
            disabled={isStreaming}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition ${
              isStreaming
                ? 'opacity-40 cursor-not-allowed bg-slate-800/40 text-slate-500 border-slate-800'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Step 1 data point forward (when paused)"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step +1</span>
          </button>

          {/* Reset to Start */}
          <button
            id="reset-btn"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            title="Reset feed to Row 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (Row 1)</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center ml-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 px-2 flex items-center gap-1">
              <FastForward className="w-3 h-3" />
              Speed:
            </span>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  speed === s
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Quick Demo Target: Jump to Incident Button */}
        <div className="flex items-center gap-2">
          <button
            id="jump-incident-btn"
            onClick={onJumpToIncident}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/80 text-rose-200 border border-rose-800/90 hover:bg-rose-900 hover:border-rose-700 transition shadow-lg shadow-rose-950/40"
            title="Jump to row 792 (timestamp 2014-04-12 17:34:00) where request count spikes from baseline ~70 to 381+"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Jump to Traffic Surge Incident</span>
          </button>

          {/* Threshold adjustment */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[11px]">Threshold:</span>
            <select
              value={thresholdZ}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="bg-slate-900 text-cyan-300 border border-slate-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="2.0">2.0σ (Sensitive)</option>
              <option value="2.5">2.5σ (Standard)</option>
              <option value="3.0">3.0σ (Strict)</option>
              <option value="3.5">3.5σ (Extreme)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dataset Scrubber Slider */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
          <div className="flex items-center gap-2">
            <span>Replay Timeline:</span>
            <span className="text-slate-200 font-bold">
              Row {currentIndex + 1} of {totalPoints || 4032}
            </span>
            <span className="text-slate-500">
              ({(((currentIndex + 1) / (totalPoints || 4032)) * 100).toFixed(1)}%)
            </span>
          </div>
          {currentTimestamp && (
            <div className="text-slate-300">
              <span className="text-slate-500">Timestamp: </span>
              <span className="font-semibold text-cyan-300">{currentTimestamp}</span>
            </div>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            id="timeline-scrubber"
            type="range"
            min="0"
            max={Math.max(0, totalPoints - 1)}
            value={currentIndex}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition"
          />
          {/* Incident marker line on scrubber at row 792 */}
          {totalPoints > 0 && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-rose-500 rounded pointer-events-none"
              style={{ left: `${(792 / totalPoints) * 100}%` }}
              title="AWS ELB Traffic Surge Incident (Row 792 / 2014-04-12 17:34:00)"
            />
          )}
        </div>
      </div>
    </div>
  );
};
