import React, { useState } from 'react';
import { AnomalyAlert, AnomalySeverity, AnomalyClassification } from '../types.ts';
import {
  ShieldAlert,
  Wrench,
  TrendingUp,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatTimeHHMMSS } from '../utils/formatters.ts';

interface AlertFeedProps {
  alerts: AnomalyAlert[];
  isAnalyzing: boolean;
  activeAnomalyPoint: { timestamp: string; value: number; zScore: number } | null;
  onClearAlerts?: () => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts,
  isAnalyzing,
  activeAnomalyPoint,
  onClearAlerts,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity === 'all') return true;
    return alert.analysis?.severity === filterSeverity;
  });

  const getSeverityBadge = (severity?: AnomalySeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-900/50 border border-rose-400/50">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow-md shadow-orange-900/50 border border-orange-400/50">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md shadow-amber-900/40 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            MEDIUM
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-md shadow-emerald-900/40 border border-emerald-400/50">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            INFO
          </span>
        );
    }
  };

  const getCardStyle = (severity?: AnomalySeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-gradient-to-b from-rose-950/40 to-slate-950/90 border-rose-700/80 hover:border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.15)]';
      case 'high':
        return 'bg-gradient-to-b from-orange-950/40 to-slate-950/90 border-orange-700/80 hover:border-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.12)]';
      case 'medium':
        return 'bg-gradient-to-b from-amber-950/40 to-slate-950/90 border-amber-700/80 hover:border-amber-600';
      case 'low':
      default:
        return 'bg-gradient-to-b from-emerald-950/40 to-slate-950/90 border-emerald-700/80 hover:border-emerald-600';
    }
  };

  const getClassificationBadge = (classification?: AnomalyClassification) => {
    switch (classification) {
      case 'genuine_surge':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-200 border border-cyan-700/90 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            Genuine Surge
          </span>
        );
      case 'bot_attack':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-200 border border-purple-700/90 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            Bot Attack
          </span>
        );
      case 'system_fault':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-200 border border-rose-700/90 shadow-sm">
            <Wrench className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            System Fault
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Unclassified
          </span>
        );
    }
  };

  return (
    <div id="alert-feed-panel" className="w-full flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-700/80 text-rose-400 shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                Live Incident Alert Feed
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {alerts.length}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                Gemini 3.8 Flash automated triage
              </p>
            </div>
          </div>

          {onClearAlerts && alerts.length > 0 && (
            <button
              onClick={onClearAlerts}
              className="text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition font-mono"
              title="Clear alert list"
            >
              Clear
            </button>
          )}
        </div>

        {/* Severity filter tabs */}
        <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pt-1 scrollbar-none">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-0.5 rounded-md capitalize font-mono text-[10px] transition ${
                filterSeverity === sev
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-600 font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[600px] scrollbar-thin scrollbar-thumb-slate-700">
        {/* Analyzing / In-Flight Card */}
        {isAnalyzing && activeAnomalyPoint && (
          <div
            id="analyzing-anomaly-card"
            className="p-3.5 rounded-lg bg-cyan-950/50 border border-cyan-600/90 shadow-lg relative overflow-hidden animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                  Analyzing anomaly with Gemini AI...
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-900/60 px-1.5 py-0.5 rounded border border-cyan-700">
                +{activeAnomalyPoint.zScore.toFixed(2)}σ
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono">
              Event Time: <span className="text-white font-bold">{formatTimeHHMMSS(activeAnomalyPoint.timestamp)}</span> | Traffic: <span className="text-cyan-300 font-bold">{activeAnomalyPoint.value.toFixed(1)} req/min</span>
            </p>
            <div className="mt-2 text-[10px] text-cyan-300/80 italic flex items-center gap-1">
              <span>Evaluating rolling window metrics and formulating tactical remediation...</span>
            </div>
          </div>
        )}

        {/* Empty State vs Alert List with AnimatePresence */}
        {filteredAlerts.length === 0 && !isAnalyzing ? (
          <div
            id="alert-feed-empty-state"
            className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-lg border border-dashed border-slate-800 bg-slate-950/40"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
              <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-200">
              No anomalies detected yet — monitoring live telemetry feed...
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs leading-relaxed">
              Standard traffic within normal baseline (&lt; 2.5σ). Click the highlighted <span className="text-amber-400 font-semibold">Jump to Traffic Surge Incident</span> button below to advance to the authentic AWS CloudWatch anomaly.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredAlerts.map((alert) => {
              const cardBgStyle = getCardStyle(alert.analysis?.severity);

              return (
                <motion.div
                  key={alert.id}
                  id={`alert-card-${alert.id}`}
                  initial={{ opacity: 0, y: -16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`p-3.5 rounded-lg border transition-all duration-200 shadow-md ${cardBgStyle}`}
                >
                  {/* Header: Severity Badge, Classification Icon, Timestamp */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center flex-wrap gap-2">
                      {getSeverityBadge(alert.analysis?.severity)}
                      {alert.analysis && getClassificationBadge(alert.analysis.classification)}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{formatTimeHHMMSS(alert.timestamp)}</span>
                    </div>
                  </div>

                  {/* Telemetry Snapshot with Explicit Units */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/80 p-2 rounded-md border border-slate-800/90 mb-2.5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">TRAFFIC</span>
                      <span className="font-extrabold text-cyan-300">{alert.value.toFixed(1)} req/min</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">BASELINE</span>
                      <span className="font-medium text-slate-300">{alert.rollingMean.toFixed(1)} req/min</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Z-SCORE</span>
                      <span className="font-extrabold text-rose-400">+{alert.zScore.toFixed(2)}σ</span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {alert.analysis?.summary && (
                    <p className="text-xs text-slate-200 leading-relaxed mb-2.5">
                      {alert.analysis.summary}
                    </p>
                  )}

                  {/* Recommended Tactical Action */}
                  {alert.analysis?.recommended_action && (
                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-md p-2.5 text-xs">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        Recommended Action:
                      </div>
                      <p className="text-slate-200 font-mono text-[11px] leading-snug">
                        {alert.analysis.recommended_action}
                      </p>
                    </div>
                  )}

                  {/* Fallback indicator */}
                  {alert.isFallback && (
                    <div className="mt-2 text-[10px] text-amber-400/90 flex items-center gap-1 font-mono">
                      <Info className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Automated fallback triage applied ({alert.error ? 'API offline' : 'quota standby'})</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
