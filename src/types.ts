export interface RawDataPoint {
  timestamp: string;
  value: number;
}

export interface StreamDataPoint {
  index: number;
  timestamp: string;
  value: number;
  mean: number;
  std: number;
  zScore: number;
  isAnomaly: boolean;
}

export type AnomalyClassification = 'genuine_surge' | 'bot_attack' | 'system_fault';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyAnalysis {
  classification: AnomalyClassification;
  severity: AnomalySeverity;
  summary: string;
  recommended_action: string;
}

export interface AnomalyAlert {
  id: string;
  pointIndex: number;
  timestamp: string;
  value: number;
  rollingMean: number;
  rollingStd: number;
  zScore: number;
  status: 'analyzing' | 'completed' | 'failed';
  analysis?: AnomalyAnalysis;
  isFallback?: boolean;
  error?: string;
  createdAt: number;
}

export interface StatsSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}
