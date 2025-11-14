import { matchEntity } from "../connectors/opensanctions.js";

export async function screenName(name: string, country?: string) {
  const res = await matchEntity({ name, country });
  return res;
}

export async function screenBatch(names: string[], country?: string) {
  const results: Record<string, unknown> = {};
  for (const n of names) {
    try {
      results[n] = await matchEntity({ name: n, country });
    } catch (e: any) {
      results[n] = { error: String(e?.message || e) };
    }
  }
  return results;
}