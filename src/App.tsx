import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RawDataPoint,
  StreamDataPoint,
  AnomalyAlert,
  StatsSummary,
} from './types.ts';
import { parseCSV } from './utils/csvParser.ts';
import { calculateWindowStats, calculateZScore } from './utils/stats.ts';
import { StatsBar } from './components/StatsBar.tsx';
import { LiveChart } from './components/LiveChart.tsx';
import { AlertFeed } from './components/AlertFeed.tsx';
import { PlaybackControls } from './components/PlaybackControls.tsx';
import {
  ShieldAlert,
  Activity,
  Server,
  Terminal,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FileText,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const CSV_PRIMARY_URL =
  'https://raw.githubusercontent.com/numenta/NAB/master/data/realAWSCloudwatch/elb_request_count_8c0756.csv';
const CSV_LOCAL_URL = '/api/dataset';

export default function App() {
  // Dataset state
  const [dataset, setDataset] = useState<RawDataPoint[]>([]);
  const [isLoadingDataset, setIsLoadingDataset] = useState<boolean>(true);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  // Replay state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1); // 0.5x, 1x, 2x, 5x
  const [thresholdZ, setThresholdZ] = useState<number>(2.5);

  // Streaming history state
  const [windowPoints, setWindowPoints] = useState<StreamDataPoint[]>([]);
  const [currentPoint, setCurrentPoint] = useState<StreamDataPoint | null>(null);

  // Alerts & AI state
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeAnomalyPoint, setActiveAnomalyPoint] = useState<{
    timestamp: string;
    value: number;
    zScore: number;
  } | null>(null);

  // Debounce ref to prevent duplicate Gemini calls during continuous multi-tick spikes
  const lastAlertPointIndexRef = useRef<number>(-100);
  const isAnalyzingRef = useRef<boolean>(false);

  // 1. Fetch the real AWS CloudWatch dataset at load time
  const loadDataset = useCallback(async () => {
    setIsLoadingDataset(true);
    setDatasetError(null);

    let csvText = '';
    let loadSource = 'remote';

    try {
      // Try primary verified URL first
      try {
        const res = await fetch(CSV_PRIMARY_URL);
        if (res.ok) {
          const text = await res.text();
          if (!text.includes('404: Not Found') && text.includes('timestamp')) {
            csvText = text;
            loadSource = 'GitHub raw';
          }
        }
      } catch {
        // Fall through to local server endpoint
      }

      // If remote fetch failed, load from local server endpoint
      if (!csvText) {
        const res = await fetch(CSV_LOCAL_URL);
        if (res.ok) {
          csvText = await res.text();
          loadSource = 'local mirror';
        }
      }

      if (!csvText || csvText.includes('404: Not Found')) {
        throw new Error('Failed to retrieve NAB CloudWatch CSV from verified sources.');
      }

      const parsed = parseCSV(csvText);
      if (parsed.length === 0) {
        throw new Error('Parsed CSV contained 0 valid rows.');
      }

      setDataset(parsed);

      // Pre-populate initial window (last 60 points before index 0 or starting point)
      // We will initialize at row 0 (or row 792 for incident demo)
      setCurrentIndex(0);
      setIsLoadingDataset(false);
      console.log(`Successfully loaded ${parsed.length} data points from ${loadSource}`);
    } catch (err: any) {
      console.error('Error fetching CSV dataset:', err);
      setDatasetError(err?.message || 'Failed to load dataset.');
      setIsLoadingDataset(false);
    }
  }, []);

  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  // 2. Call Gemini API to triage anomaly
  const triggerGeminiTriage = async (
    anomalyPoint: StreamDataPoint,
    recentWindow: StreamDataPoint[]
  ) => {
    if (isAnalyzingRef.current) return;

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setActiveAnomalyPoint({
      timestamp: anomalyPoint.timestamp,
      value: anomalyPoint.value,
      zScore: anomalyPoint.zScore,
    });

    const alertId = `alert-${anomalyPoint.index}-${Date.now()}`;

    try {
      const response = await fetch('/api/analyze-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPoint: {
            timestamp: anomalyPoint.timestamp,
            value: anomalyPoint.value,
          },
          windowPoints: recentWindow.map((p) => ({
            timestamp: p.timestamp,
            value: p.value,
          })),
          rollingMean: anomalyPoint.mean,
          rollingStd: anomalyPoint.std,
          zScore: anomalyPoint.zScore,
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        const newAlert: AnomalyAlert = {
          id: alertId,
          pointIndex: anomalyPoint.index,
          timestamp: anomalyPoint.timestamp,
          value: anomalyPoint.value,
          rollingMean: anomalyPoint.mean,
          rollingStd: anomalyPoint.std,
          zScore: anomalyPoint.zScore,
          status: 'completed',
          analysis: data.analysis,
          isFallback: data.isFallback,
          error: data.error,
          createdAt: Date.now(),
        };

        setAlerts((prev) => [newAlert, ...prev]);
      } else {
        throw new Error(data.error || 'Invalid triage response');
      }
    } catch (err: any) {
      console.log('[GovPulse] Triage fallback alert card generated:', err?.message || err);

      // Graceful fallback alert card
      const fallbackAlert: AnomalyAlert = {
        id: alertId,
        pointIndex: anomalyPoint.index,
        timestamp: anomalyPoint.timestamp,
        value: anomalyPoint.value,
        rollingMean: anomalyPoint.mean,
        rollingStd: anomalyPoint.std,
        zScore: anomalyPoint.zScore,
        status: 'failed',
        isFallback: true,
        error: err?.message || 'Gemini API call failed',
        analysis: {
          classification: anomalyPoint.zScore > 15 ? 'system_fault' : 'genuine_surge',
          severity: anomalyPoint.zScore > 15 ? 'critical' : anomalyPoint.zScore > 5 ? 'high' : 'medium',
          summary: `Request traffic surged to ${anomalyPoint.value.toFixed(0)} req/interval (+${anomalyPoint.zScore.toFixed(1)}σ deviation). Analysis generated via heuristic fallback engine.`,
          recommended_action: 'Check AWS CloudWatch ELB request count metrics and verify target group auto-scaling thresholds.',
        },
        createdAt: Date.now(),
      };

      setAlerts((prev) => [fallbackAlert, ...prev]);
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setActiveAnomalyPoint(null);
    }
  };

  // 3. Main Replay Loop: processes the current index and emits streaming point
  const processPointAtIndex = useCallback(
    (index: number, datasetArr: RawDataPoint[]) => {
      if (datasetArr.length === 0 || index >= datasetArr.length) return;

      const raw = datasetArr[index];

      // 30-point moving window for rolling mean & std dev
      const windowStartIndex = Math.max(0, index - 29);
      const windowSlice = datasetArr.slice(windowStartIndex, index + 1);
      const values = windowSlice.map((p) => p.value);

      const { mean, std } = calculateWindowStats(values);
      const zScore = calculateZScore(raw.value, mean, std);
      const isAnomaly = zScore > thresholdZ;

      const newStreamPoint: StreamDataPoint = {
        index,
        timestamp: raw.timestamp,
        value: raw.value,
        mean,
        std,
        zScore,
        isAnomaly,
      };

      setCurrentPoint(newStreamPoint);

      // Maintain last 60 points for the chart window
      setWindowPoints((prev) => {
        const next = [...prev, newStreamPoint];
        if (next.length > 60) {
          return next.slice(next.length - 60);
        }
        return next;
      });

      // Anomaly trigger check with cooldown to prevent duplicate calls for the same event
      if (isAnomaly) {
        const pointsSinceLastAlert = index - lastAlertPointIndexRef.current;
        // Trigger alert if it's been at least 8 ticks since last alert, or if z-score jumped massively
        if (pointsSinceLastAlert >= 8 || lastAlertPointIndexRef.current === -100) {
          lastAlertPointIndexRef.current = index;
          // Capture current window for Gemini payload
          const recentPoints = datasetArr.slice(Math.max(0, index - 20), index + 1).map((p, i) => ({
            index: index - 20 + i,
            timestamp: p.timestamp,
            value: p.value,
            mean,
            std,
            zScore: calculateZScore(p.value, mean, std),
            isAnomaly: calculateZScore(p.value, mean, std) > thresholdZ,
          }));

          triggerGeminiTriage(newStreamPoint, recentPoints);
        }
      }
    },
    [thresholdZ]
  );

  // 4. Timer interval for live replay
  useEffect(() => {
    if (!isStreaming || dataset.length === 0) return;

    // Base tick is 500ms, divided by speed multiplier (0.5x -> 1000ms, 1x -> 500ms, 2x -> 250ms, 5x -> 100ms)
    const intervalMs = Math.max(50, Math.round(500 / speed));

    const timer = setInterval(() => {
      setCurrentIndex((prevIdx) => {
        if (prevIdx >= dataset.length - 1) {
          setIsStreaming(false);
          return prevIdx;
        }
        const nextIdx = prevIdx + 1;
        processPointAtIndex(nextIdx, dataset);
        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, speed, dataset, processPointAtIndex]);

  // Initial populate when dataset first loads
  useEffect(() => {
    if (dataset.length > 0 && windowPoints.length === 0) {
      // Seed initial points up to currentIndex
      const startIndex = Math.max(0, currentIndex - 30);
      const initialPoints: StreamDataPoint[] = [];

      for (let i = startIndex; i <= currentIndex; i++) {
        const raw = dataset[i];
        const wStart = Math.max(0, i - 29);
        const wSlice = dataset.slice(wStart, i + 1);
        const { mean, std } = calculateWindowStats(wSlice.map((p) => p.value));
        const zScore = calculateZScore(raw.value, mean, std);
        initialPoints.push({
          index: i,
          timestamp: raw.timestamp,
          value: raw.value,
          mean,
          std,
          zScore,
          isAnomaly: zScore > thresholdZ,
        });
      }

      setWindowPoints(initialPoints.slice(-60));
      if (initialPoints.length > 0) {
        setCurrentPoint(initialPoints[initialPoints.length - 1]);
      }
    }
  }, [dataset, currentIndex, thresholdZ, windowPoints.length]);

  // Seek / Scrubber handler
  const handleSeek = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= dataset.length) return;
    setCurrentIndex(newIndex);

    // Reconstruct last 60 points up to newIndex
    const startIdx = Math.max(0, newIndex - 59);
    const rebuilt: StreamDataPoint[] = [];

    for (let i = startIdx; i <= newIndex; i++) {
      const raw = dataset[i];
      const wStart = Math.max(0, i - 29);
      const wSlice = dataset.slice(wStart, i + 1);
      const { mean, std } = calculateWindowStats(wSlice.map((p) => p.value));
      const zScore = calculateZScore(raw.value, mean, std);
      rebuilt.push({
        index: i,
        timestamp: raw.timestamp,
        value: raw.value,
        mean,
        std,
        zScore,
        isAnomaly: zScore > thresholdZ,
      });
    }

    setWindowPoints(rebuilt);
    if (rebuilt.length > 0) {
      setCurrentPoint(rebuilt[rebuilt.length - 1]);
    }
  };

  // Step forward single point
  const handleStepForward = () => {
    if (currentIndex < dataset.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      processPointAtIndex(nextIdx, dataset);
    }
  };

  // Jump to traffic surge incident in dataset (Row 792 / 2014-04-12 17:34:00)
  const handleJumpToIncident = () => {
    // Jump to row 792 (timestamp 2014-04-12 17:34:00), where request count spikes from baseline ~70 to 381+
    const surgeIdx = dataset.findIndex((d) => d.timestamp.includes('2014-04-12 17:34:00'));
    handleSeek(surgeIdx !== -1 ? surgeIdx : 792);
    setIsStreaming(true);
  };

  // Reset to Row 0
  const handleReset = () => {
    handleSeek(0);
    setIsStreaming(true);
  };

  // Calculate stats breakdown
  const stats: StatsSummary = {
    total: alerts.length,
    critical: alerts.filter((a) => a.analysis?.severity === 'critical').length,
    high: alerts.filter((a) => a.analysis?.severity === 'high').length,
    medium: alerts.filter((a) => a.analysis?.severity === 'medium').length,
    low: alerts.filter((a) => a.analysis?.severity === 'low').length,
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation / Portal Header */}
      <header className="border-b border-slate-800/90 bg-[#0c1222]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/40">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-wider text-slate-100 font-mono">
                  GovPulse
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Ops Center
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Federal Citizen Portal Infrastructure — Real-Time Anomaly Triage
              </p>
            </div>
          </div>

          {/* Portal Target & Streaming Status Badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-500">Target:</span>
              <span className="font-semibold text-slate-200">secure.tax.gov (AWS ELB Traffic)</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {isStreaming ? 'STREAMING ACTIVE' : 'STREAM PAUSED'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <StatsBar
          stats={stats}
          currentPoint={currentPoint}
          totalPoints={dataset.length}
          currentIndex={currentIndex}
          isStreaming={isStreaming}
          speed={speed}
        />
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Loading / Error States for Dataset */}
        {isLoadingDataset && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">
              Fetching real AWS CloudWatch benchmark dataset...
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              elb_request_count_8c0756.csv (Numenta Anomaly Benchmark)
            </p>
          </div>
        )}

        {datasetError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase">Dataset Load Issue</h4>
                <p className="text-xs text-rose-300 mt-0.5">{datasetError}</p>
              </div>
            </div>
            <button
              onClick={loadDataset}
              className="px-3 py-1.5 rounded bg-rose-800 hover:bg-rose-700 text-white text-xs font-mono transition"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoadingDataset && dataset.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 8 Columns: Live Streaming Chart & Playback Engine */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Primary Live-updating SVG Line Chart */}
              <LiveChart
                windowPoints={windowPoints}
                currentPoint={currentPoint}
                thresholdZ={thresholdZ}
              />

              {/* Playback & Speed Controls */}
              <PlaybackControls
                isStreaming={isStreaming}
                onToggleStreaming={() => setIsStreaming((prev) => !prev)}
                speed={speed}
                onSpeedChange={setSpeed}
                currentIndex={currentIndex}
                totalPoints={dataset.length}
                onSeek={handleSeek}
                onStepForward={handleStepForward}
                onJumpToIncident={handleJumpToIncident}
                onReset={handleReset}
                thresholdZ={thresholdZ}
                onThresholdChange={setThresholdZ}
                currentTimestamp={currentPoint?.timestamp}
              />

              {/* Technical Architecture & Benchmark Context */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 text-slate-100 font-semibold mb-2 text-xs">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Detection Architecture & Real Data Provenance</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <span className="text-cyan-300 font-bold block mb-1">
                      1. Real-World AWS CloudWatch Dataset
                    </span>
                    <p className="leading-relaxed">
                      Metrics originate from the peer-reviewed Numenta Anomaly Benchmark (NAB) realAWSCloudwatch repository (elb_request_count_8c0756.csv). Contains 4,032 real 5-minute AWS ELB request count recordings, capturing an authentic traffic surge where traffic rises from a baseline of ~70 requests/interval spiking to 380+, sometimes reaching 650+.
                    </p>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <span className="text-cyan-300 font-bold block mb-1">
                      2. Real-Time Z-Score + Gemini 3.6 Flash
                    </span>
                    <p className="leading-relaxed">
                      A sliding 30-point window computes rolling mean (μ) and standard deviation (σ). Exceeding the threshold (Z &gt; {thresholdZ.toFixed(1)}σ) triggers structured Gemini triage classifying failure modes and recommending immediate mitigation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Live Incident Alert Feed */}
            <div className="lg:col-span-4 h-full">
              <AlertFeed
                alerts={alerts}
                isAnalyzing={isAnalyzing}
                activeAnomalyPoint={activeAnomalyPoint}
                onClearAlerts={() => setAlerts([])}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-2.5 text-[11px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>GovPulse Portal Monitor • US Digital Service Protocol</span>
          <span className="text-slate-400">
            Engine: React 19 + Tailwind CSS + Gemini 3.6 Flash
          </span>
        </div>
      </footer>
    </div>
  );
}
