import crypto from "crypto";
const chain = [];
export function appendEvidence(type, payload) {
    const timestamp = Date.now();
    const prev = chain.length ? chain[chain.length - 1].hash : undefined;
    const id = crypto.randomUUID();
    const content = JSON.stringify({ id, timestamp, type, payload, prev });
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    const rec = { id, timestamp, type, payload, prev, hash };
    chain.push(rec);
    return rec;
}
export function getChain() {
    return chain;
}
export function verifyChain() {
    let prev = undefined;
    for (const rec of chain) {
        const content = JSON.stringify({ id: rec.id, timestamp: rec.timestamp, type: rec.type, payload: rec.payload, prev: rec.prev });
        const hash = crypto.createHash("sha256").update(content).digest("hex");
        if (hash !== rec.hash)
            return { ok: false, at: rec.id, reason: "hash_mismatch" };
        if (rec.prev !== prev)
            return { ok: false, at: rec.id, reason: "prev_mismatch" };
        prev = rec.hash;
    }
    return { ok: true };
}
