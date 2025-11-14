import { screenName } from "./sanctions.js";
import { listPsc } from "../connectors/companies_house.js";

export async function simpleRiskScore(input: { name?: string; country?: string; companyNumber?: string }) {
  let sanctionsHits = 0;
  if (input.name) {
    try {
      const res = await screenName(input.name, input.country);
      sanctionsHits = Array.isArray(res?.matches) ? res.matches.length : (res?.results?.length || 0);
    } catch {}
  }

  let hasPsc = false;
  if (input.companyNumber) {
    try {
      const psc = await listPsc(input.companyNumber);
      hasPsc = !!psc && ((psc.items?.length || 0) > 0);
    } catch {}
  }

  const base = 50;
  const score = Math.max(0, Math.min(100, base + sanctionsHits * 10 + (hasPsc ? 5 : -5)));
  return { score, features: { sanctionsHits, hasPsc } };
}