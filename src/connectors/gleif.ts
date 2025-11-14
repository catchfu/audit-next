import axios from "axios";
import { logger } from "../logger.js";

export async function searchLei(fulltext: string) {
  const url = "https://api.gleif.org/api/v1/lei-records";
  const params = { "filter[fulltext]": fulltext, "page[size]": 10 } as const;
  const res = await axios.get(url, { params });
  logger.debug({ size: res.data?.data?.length || 0 }, "gleif_search");
  return res.data;
}

export async function getLeiRecord(lei: string) {
  const url = `https://api.gleif.org/api/v1/lei-records/${lei}`;
  const res = await axios.get(url);
  return res.data;
}