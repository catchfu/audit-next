import axios from "axios";
import { config } from "../config.js";

const BASE = "https://api.opencorporates.com/v0.4";

function requireToken() {
  if (!config.openCorporatesApiToken) throw new Error("OPEN_CORPORATES_API_TOKEN missing");
}

export async function ocGetCompany(jurisdictionCode: string, companyNumber: string) {
  requireToken();
  const url = `${BASE}/companies/${jurisdictionCode}/${companyNumber}`;
  const res = await axios.get(url, { params: { api_token: config.openCorporatesApiToken } });
  return res.data;
}

export async function ocSearchCompanies(q: string, jurisdictionCode?: string) {
  requireToken();
  const url = `${BASE}/companies/search`;
  const params: any = { q, api_token: config.openCorporatesApiToken };
  if (jurisdictionCode) params.jurisdiction_code = jurisdictionCode;
  const res = await axios.get(url, { params });
  return res.data;
}