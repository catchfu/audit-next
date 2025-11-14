import { matchEntity } from "../connectors/opensanctions.js";
export async function screenName(name, country) {
    const res = await matchEntity({ name, country });
    return res;
}
export async function screenBatch(names, country) {
    const results = {};
    for (const n of names) {
        try {
            results[n] = await matchEntity({ name: n, country });
        }
        catch (e) {
            results[n] = { error: String(e?.message || e) };
        }
    }
    return results;
}
