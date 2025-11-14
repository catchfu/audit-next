import axios from "axios";
import { config } from "../config.js";

export async function getPscStatements(companyNumber: string, itemsPerPage = 25, startIndex = 0, registerView = false) {
  if (!config.companiesHouseApiKey) throw new Error("COMPANIES_HOUSE_API_KEY missing");
  const url = `https://api.company-information.service.gov.uk/company/${companyNumber}/persons-with-significant-control-statements`;
  const params = { items_per_page: itemsPerPage, start_index: startIndex, register_view: registerView } as const;
  const res = await axios.get(url, {
    params,
    auth: { username: config.companiesHouseApiKey, password: "" },
  });
  return res.data;
}

export async function listPsc(companyNumber: string) {
  if (!config.companiesHouseApiKey) throw new Error("COMPANIES_HOUSE_API_KEY missing");
  const url = `https://api.company-information.service.gov.uk/company/${companyNumber}/persons-with-significant-control`;
  const res = await axios.get(url, {
    auth: { username: config.companiesHouseApiKey, password: "" },
  });
  return res.data;
}