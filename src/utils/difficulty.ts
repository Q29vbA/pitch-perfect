export const LEVELS = [300, 240, 190, 150, 120, 100, 80, 65, 50, 40, 30, 22, 15, 10, 7, 5] as const;

const PERCENTILE_TABLE: [number, number][] = [
  [300, 100],
  [150, 85],
  [100, 70],
  [65, 55],
  [40, 40],
  [22, 25],
  [10, 12],
  [5, 4],
];

export function centsToPercentile(cents: number): number {
  // Find nearest match
  let closest = PERCENTILE_TABLE[0];
  let minDist = Math.abs(cents - closest[0]);

  for (const entry of PERCENTILE_TABLE) {
    const dist = Math.abs(cents - entry[0]);
    if (dist < minDist) {
      minDist = dist;
      closest = entry;
    }
  }

  return closest[1];
}
