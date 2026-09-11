/**
 * Formatting utilities for explicit units across GovPulse
 */

export function formatTimeHHMMSS(timestamp?: string): string {
  if (!timestamp) return '--:--:--';
  const parts = timestamp.trim().split(' ');
  if (parts.length > 1 && parts[1]) {
    // Returns HH:MM:SS if present
    return parts[1].length >= 8 ? parts[1].substring(0, 8) : parts[1];
  }
  const isoMatch = timestamp.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];
  return timestamp;
}

export function formatRequests(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '-- req/min';
  return `${val.toFixed(1)} req/min`;
}

export function formatZScore(z?: number): string {
  if (z === undefined || z === null || isNaN(z)) return '0.00σ';
  const sign = z >= 0 ? '+' : '';
  return `${sign}${z.toFixed(2)}σ`;
}
