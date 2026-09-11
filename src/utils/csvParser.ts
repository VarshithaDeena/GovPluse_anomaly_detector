import { RawDataPoint } from '../types.ts';

/**
 * Simple, fast CSV parser for time-series datasets with `timestamp,value` columns.
 */
export function parseCSV(csvText: string): RawDataPoint[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/);
  const data: RawDataPoint[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if header row
    if (i === 0 && line.toLowerCase().includes('timestamp')) {
      continue;
    }

    const commaIdx = line.indexOf(',');
    if (commaIdx === -1) continue;

    const timestamp = line.substring(0, commaIdx).trim();
    const valStr = line.substring(commaIdx + 1).trim();
    const value = parseFloat(valStr);

    if (!isNaN(value)) {
      data.push({ timestamp, value });
    }
  }

  return data;
}
