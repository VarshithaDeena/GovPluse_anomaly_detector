import React, { useState } from 'react';
import { AnomalyAlert, AnomalySeverity, AnomalyClassification } from '../types.ts';
import {
  AlertOctagon,
  ShieldAlert,
  ServerCrash,
  Zap,
  Bot,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';

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

  const getSeverityStyle = (severity?: AnomalySeverity) => {
    switch (severity) {
      case 'critical':
        return {
          cardBg: 'bg-rose-950/30 border-rose-800/80 hover:border-rose-700',
          badgeBg: 'bg-rose-900/60 text-rose-200 border-rose-700/80',
          iconColor: 'text-rose-400',
          pulseColor: 'bg-rose-500',
          label: 'CRITICAL',
        };
      case 'high':
        return {
          cardBg: 'bg-orange-950/30 border-orange-800/80 hover:border-orange-700',
          badgeBg: 'bg-orange-900/60 text-orange-200 border-orange-700/80',
          iconColor: 'text-orange-400',
          pulseColor: 'bg-orange-500',
          label: 'HIGH',
        };
      case 'medium':
        return {
          cardBg: 'bg-amber-950/30 border-amber-800/80 hover:border-amber-700',
          badgeBg: 'bg-amber-900/60 text-amber-200 border-amber-700/80',
          iconColor: 'text-amber-400',
          pulseColor: 'bg-amber-500',
          label: 'MEDIUM',
        };
      case 'low':
      default:
        return {
          cardBg: 'bg-emerald-950/30 border-emerald-800/80 hover:border-emerald-700',
          badgeBg: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/80',
          iconColor: 'text-emerald-400',
          pulseColor: 'bg-emerald-500',
          label: 'LOW',
        };
    }
  };

  const getClassificationBadge = (classification?: AnomalyClassification) => {
    switch (classification) {
      case 'system_fault':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-900/60 text-rose-300 border border-rose-800">
            <ServerCrash className="w-3 h-3" />
            System Fault
          </span>
        );
      case 'bot_attack':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-900/60 text-purple-300 border border-purple-800">
            <Bot className="w-3 h-3" />
            Bot Attack
          </span>
        );
      case 'genuine_surge':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-900/60 text-cyan-300 border border-cyan-800">
            <Zap className="w-3 h-3" />
            Genuine Surge
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle className="w-3 h-3" />
            Unclassified
          </span>
        );
    }
  };

  return (
    <div id="alert-feed-panel" className="w-full flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-950/60 border border-rose-800/80 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                Live Incident Alert Feed
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
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
              className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 transition"
              title="Clear alert list"
            >
              Clear
            </button>
          )}
        </div>

        {/* Severity filter tabs */}
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto pt-1 scrollbar-none">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded capitalize font-mono text-[10px] transition ${
                filterSeverity === sev
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[580px] scrollbar-thin scrollbar-thumb-slate-700">
        {/* Analyzing / In-Flight Card */}
        {isAnalyzing && activeAnomalyPoint && (
          <div
            id="analyzing-anomaly-card"
            className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-700/80 shadow-lg relative overflow-hidden animate-pulse"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                  Analyzing anomaly with Gemini AI...
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">
                Z: +{activeAnomalyPoint.zScore.toFixed(1)}σ
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono">
              Timestamp: {activeAnomalyPoint.timestamp} | Requests: {activeAnomalyPoint.value.toFixed(1)} req/interval
            </p>
            <div className="mt-2 text-[10px] text-cyan-200/80 italic flex items-center gap-1">
              <span>Evaluating recent traffic window and diagnosing anomaly classification...</span>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {filteredAlerts.length === 0 && !isAnalyzing ? (
          <div className="text-center py-12 px-4">
            <CheckCircle className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-300">No active alerts in current view</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Normal request volume is being observed. Use the &quot;Jump to Traffic Surge Incident&quot; button to advance to row 792 to observe the live traffic surge.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const style = getSeverityStyle(alert.analysis?.severity);

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-3.5 rounded-lg border transition-all duration-200 shadow-md ${style.cardBg}`}
              >
                {/* Header: Severity & Timestamp */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${style.badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.pulseColor}`}></span>
                      {style.label}
                    </span>
                    {alert.analysis && getClassificationBadge(alert.analysis.classification)}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{alert.timestamp}</span>
                  </div>
                </div>

                {/* Telemetry Snapshot */}
                <div className="flex items-center gap-3 text-[11px] font-mono bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/80 mb-2">
                  <div>
                    <span className="text-slate-500">Requests: </span>
                    <span className="font-bold text-slate-200">{alert.value.toFixed(1)} req/interval</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Base: </span>
                    <span className="text-slate-300">{alert.rollingMean.toFixed(1)} req/interval</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Z-Score: </span>
                    <span className="font-bold text-rose-400">+{alert.zScore.toFixed(2)}σ</span>
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
                  <div className="bg-slate-950/80 border border-slate-800 rounded p-2 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      Recommended Action:
                    </div>
                    <p className="text-cyan-200/90 font-mono text-[11px] leading-snug">
                      {alert.analysis.recommended_action}
                    </p>
                  </div>
                )}

                {/* Fallback indicator if network/quota fallback was triggered */}
                {alert.isFallback && (
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-400" />
                    <span>Automated fallback triage applied ({alert.error ? 'API unavailable' : 'offline'})</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
