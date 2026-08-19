const SEASONS = { low: 1, shoulder: 1.25, high: 1.6 };

// Occupancy above the base of two is charged per extra head, not per night, because the
// nightly export reconciles against the booking flow and the two disagreed for a month.
export function quote({ base, season, occupancy }) {
  const multiplier = SEASONS[season];
  if (multiplier === undefined) throw new Error(`unknown season: ${season}`);
  const extraHeads = Math.max(0, occupancy - 2);
  return Math.round(base * multiplier) + extraHeads * 15;
}
