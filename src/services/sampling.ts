export function topK(values: number[], k: number) {
  const sorted = [...values].sort((a, b) => b - a);
  return sorted.slice(0, k);
}

export function weightedSample(values: number[], k: number) {
  const total = values.reduce((s, v) => s + (v > 0 ? v : 0), 0);
  const picks: number[] = [];
  const pickedIdx = new Set<number>();
  const n = values.length;
  for (let i = 0; i < Math.min(k, n); i++) {
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < n; j++) {
      const w = values[j] > 0 ? values[j] : 0;
      if (pickedIdx.has(j)) continue;
      if (r <= w) { idx = j; break; }
      r -= w;
    }
    pickedIdx.add(idx);
    picks.push(values[idx]);
  }
  return picks;
}