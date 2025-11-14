import axios from "axios";
import { config } from "../config.js";
function padCik(cik) {
    const digits = cik.replace(/\D/g, "");
    return digits.padStart(10, "0");
}
export async function getCompanyFacts(cik) {
    const padded = padCik(cik);
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
    const res = await axios.get(url, {
        headers: { "User-Agent": config.userAgent, Accept: "application/json" },
        validateStatus: (s) => s >= 200 && s < 300,
    });
    return res.data;
}
