import crypto from "crypto";

type EvidenceRecord = {
  id: string;
  timestamp: number;
  type: string;
  payload: unknown;
  prev?: string;
  hash: string;
};

const chain: EvidenceRecord[] = [];

export function appendEvidence(type: string, payload: unknown) {
  const timestamp = Date.now();
  const prev = chain.length ? chain[chain.length - 1].hash : undefined;
  const id = crypto.randomUUID();
  const content = JSON.stringify({ id, timestamp, type, payload, prev });
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  const rec: EvidenceRecord = { id, timestamp, type, payload, prev, hash };
  chain.push(rec);
  return rec;
}

export function getChain() {
  return chain;
}

export function verifyChain() {
  let prev: string | undefined = undefined;
  for (const rec of chain) {
    const content = JSON.stringify({ id: rec.id, timestamp: rec.timestamp, type: rec.type, payload: rec.payload, prev: rec.prev });
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    if (hash !== rec.hash) return { ok: false, at: rec.id, reason: "hash_mismatch" } as const;
    if (rec.prev !== prev) return { ok: false, at: rec.id, reason: "prev_mismatch" } as const;
    prev = rec.hash;
  }
  return { ok: true } as const;
}