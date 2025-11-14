import axios from "axios";
import { config } from "../config.js";
export async function matchEntity(query) {
    if (!config.openSanctionsApiKey)
        throw new Error("OPEN_SANCTIONS_API_KEY missing");
    const url = "https://api.opensanctions.org/match";
    const params = { q: query.name };
    if (query.country)
        params.country = query.country;
    const headers = { Authorization: `Bearer ${config.openSanctionsApiKey}` };
    const res = await axios.get(url, { params, headers });
    return res.data;
}
