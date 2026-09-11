import React, { useState, useRef } from 'react';
import { StreamDataPoint } from '../types.ts';
import { formatTimeHHMMSS } from '../utils/formatters.ts';

interface LiveChartProps {
  windowPoints: StreamDataPoint[];
  currentPoint: StreamDataPoint | null;
  thresholdZ: number;
}

export const LiveChart: React.FC<LiveChartProps> = ({
  windowPoints,
  currentPoint,
  thresholdZ,
}) => {
  const [hoverPoint, setHoverPoint] = useState<StreamDataPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Layout parameters for SVG chart
  const width = 800;
  const height = 320;
  const padding = { top: 32, right: 35, bottom: 48, left: 68 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Derive min and max for scaling
  const values = windowPoints.map((p) => p.value);
  const rawMin = values.length > 0 ? Math.min(...values) : 30;
  const rawMax = values.length > 0 ? Math.max(...values) : 60;

  // Include threshold values in domain calculation so line is never cut off
  const thresholdValues = windowPoints.map((p) => p.mean + thresholdZ * p.std);
  const maxThreshold = thresholdValues.length > 0 ? Math.max(...thresholdValues) : 55;

  const yMin = Math.max(0, Math.floor(Math.min(rawMin - 5, 30)));
  const yMax = Math.ceil(Math.max(rawMax + 5, maxThreshold + 5, 60));
  const yRange = Math.max(yMax - yMin, 10);

  const getX = (index: number) => {
    if (windowPoints.length <= 1) return padding.left;
    return padding.left + (index / (windowPoints.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padding.top + plotHeight - ((val - yMin) / yRange) * plotHeight;
  };

  // Generate SVG path for primary request count series
  const pointsPath = windowPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(p.value).toFixed(1)}`)
    .join(' ');

  // Generate area path for subtle glow fill
  const areaPath =
    windowPoints.length > 0
      ? `${pointsPath} L ${getX(windowPoints.length - 1).toFixed(1)},${(
          padding.top + plotHeight
        ).toFixed(1)} L ${getX(0).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} Z`
      : '';

  // Generate path for rolling mean line
  const meanPath = windowPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(p.mean).toFixed(1)}`)
    .join(' ');

  // Generate path for anomaly threshold line (mean + thresholdZ * std)
  const thresholdPath = windowPoints
    .map((p, i) => {
      const threshVal = p.mean + thresholdZ * p.std;
      return `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(threshVal).toFixed(1)}`;
    })
    .join(' ');

  // Grid tick levels
  const yTicks = [
    yMin,
    Math.round(yMin + yRange * 0.25),
    Math.round(yMin + yRange * 0.5),
    Math.round(yMin + yRange * 0.75),
    yMax,
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || windowPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    if (svgX < padding.left || svgX > width - padding.right) {
      setHoverPoint(null);
      setHoverCoords(null);
      return;
    }

    const relX = svgX - padding.left;
    const indexRatio = relX / plotWidth;
    const index = Math.min(
      windowPoints.length - 1,
      Math.max(0, Math.round(indexRatio * (windowPoints.length - 1)))
    );

    const pt = windowPoints[index];
    if (pt) {
      setHoverPoint(pt);
      setHoverCoords({ x: getX(index), y: getY(pt.value) });
    }
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
    setHoverCoords(null);
  };

  // Anomaly points inside window
  const anomalyPoints = windowPoints.filter((p) => p.isAnomaly);

  return (
    <div
      id="live-chart-container"
      className="relative w-full rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl backdrop-blur-md"
    >
      {/* Chart Header & Live Telemetry Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">
              Live ELB Traffic Stream (Last 60 Points)
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-700 text-cyan-300">
              AWS CloudWatch
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <span className="text-amber-400 font-semibold">Live stream:</span> Numenta Anomaly Benchmark authentic AWS ELB request series (sampled every 5m)
          </p>
        </div>

        {/* Legend with Explicit Units */}
        <div className="flex items-center flex-wrap gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded-sm inline-block shadow-[0_0_8px_rgba(34,211,238,0.5)]"></span>
            <span className="text-slate-200 font-bold">Requests (req/min)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-400 border-b border-dashed border-blue-400 inline-block"></span>
            <span className="text-slate-400">30pt Mean (req/min)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
            <span className="text-rose-300 font-bold">Threshold (+{thresholdZ.toFixed(1)}σ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
            <span className="text-rose-400 font-semibold">Spike Anomaly</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Stage */}
      <div className="relative w-full aspect-[25/10] min-h-[260px] select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Gradient for area under request curve */}
            <linearGradient id="requestsGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
              <stop offset="65%" stopColor="#06b6d4" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis with explicit unit notation */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                  strokeOpacity="0.6"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Y Axis Unit Label */}
          <text
            x={padding.left - 8}
            y={padding.top - 12}
            textAnchor="end"
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            req/min
          </text>

          {/* X Axis Base Line */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={width - padding.right}
            y2={padding.top + plotHeight}
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#requestsGlow)" />}

          {/* Rolling Mean Line (Dashed Blue) */}
          {meanPath && (
            <path
              d={meanPath}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeOpacity="0.8"
            />
          )}

          {/* Anomaly Threshold Line (Dashed Rose) */}
          {thresholdPath && (
            <path
              d={thresholdPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.6"
              strokeDasharray="4 3"
              strokeOpacity="0.9"
            />
          )}

          {/* Primary Traffic Line */}
          {pointsPath && (
            <path
              d={pointsPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Highlight Anomaly Points with Pulsing Red Markers */}
          {anomalyPoints.map((pt, idx) => {
            const ptIndex = windowPoints.indexOf(pt);
            if (ptIndex === -1) return null;
            const x = getX(ptIndex);
            const y = getY(pt.value);

            return (
              <g key={`anomaly-${pt.index}-${idx}`}>
                <circle cx={x} cy={y} r="9" fill="#f43f5e" fillOpacity="0.35" className="animate-ping" />
                <circle cx={x} cy={y} r="5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* Current Latest Point Marker */}
          {windowPoints.length > 0 && (
            <g>
              <circle
                cx={getX(windowPoints.length - 1)}
                cy={getY(windowPoints[windowPoints.length - 1].value)}
                r="4.5"
                fill="#06b6d4"
                stroke="#fff"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(windowPoints.length - 1)}
                cy={getY(windowPoints[windowPoints.length - 1].value)}
                r="10"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                opacity="0.8"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Hover Crosshair & Indicator */}
          {hoverPoint && hoverCoords && (
            <g>
              <line
                x1={hoverCoords.x}
                y1={padding.top}
                x2={hoverCoords.x}
                y2={padding.top + plotHeight}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle
                cx={hoverCoords.x}
                cy={hoverCoords.y}
                r="5"
                fill={hoverPoint.isAnomaly ? '#f43f5e' : '#38bdf8'}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis Timestamps formatted as HH:MM:SS */}
          {windowPoints.map((p, i) => {
            if (i % 12 === 0 || i === windowPoints.length - 1) {
              const x = getX(i);
              const timeLabel = formatTimeHHMMSS(p.timestamp);

              return (
                <text
                  key={`time-${i}`}
                  x={x}
                  y={padding.top + plotHeight + 22}
                  textAnchor={i === 0 ? 'start' : i === windowPoints.length - 1 ? 'end' : 'middle'}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {timeLabel}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Hover Tooltip Overlay with Explicit Units */}
        {hoverPoint && hoverCoords && (
          <div
            className="absolute pointer-events-none z-20 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(hoverCoords.x / width) * 100}%`,
              top: `${(hoverCoords.y / height) * 100}%`,
            }}
          >
            <div className="bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs font-mono backdrop-blur-md min-w-[190px]">
              <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center">
                <span>Time: {formatTimeHHMMSS(hoverPoint.timestamp)}</span>
                {hoverPoint.isAnomaly && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider">
                    ANOMALY
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Traffic:</span>
                <span className="font-extrabold text-cyan-300">{hoverPoint.value.toFixed(1)} req/min</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Rolling Mean:</span>
                <span className="text-slate-200">{hoverPoint.mean.toFixed(1)} req/min</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Std Dev (σ):</span>
                <span className="text-slate-200">{hoverPoint.std.toFixed(2)}σ</span>
              </div>
              <div className="flex justify-between items-center py-0.5 pt-1 border-t border-slate-800/80 mt-1">
                <span className="text-slate-400 font-bold">Z-Score:</span>
                <span
                  className={`font-black ${
                    hoverPoint.isAnomaly ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {hoverPoint.zScore >= 0 ? '+' : ''}
                  {hoverPoint.zScore.toFixed(2)}σ
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Sub-Bar: Telemetry Status with explicit units */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/70 pt-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Threshold:</span>
          <span className="text-rose-300 font-bold">Z-Score &gt; +{thresholdZ.toFixed(1)}σ</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Sliding Window:</span>
          <span className="text-slate-300">30 samples (Mean & Std Dev)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Window Min/Max:</span>
          <span className="text-cyan-300 font-semibold">
            {values.length > 0 ? `${Math.min(...values).toFixed(0)} - ${Math.max(...values).toFixed(0)} req/min` : '-- req/min'}
          </span>
        </div>
      </div>
    </div>
  );
};
