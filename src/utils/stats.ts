/**
 * Computes rolling mean and standard deviation over a sliding window of numbers.
 */
export function calculateWindowStats(values: number[]): { mean: number; std: number } {
  if (values.length === 0) {
    return { mean: 0, std: 0 };
  }

  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;

  if (n === 1) {
    return { mean, std: 0 };
  }

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  return { mean, std };
}

/**
 * Computes the Z-Score of a given value given baseline mean and standard deviation.
 * Clamps minimal std to 0.05 to avoid division by zero on flat baselines.
 */
export function calculateZScore(value: number, mean: number, std: number): number {
  const effectiveStd = Math.max(std, 0.05);
  return (value - mean) / effectiveStd;
}
