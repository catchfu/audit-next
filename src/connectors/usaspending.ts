import axios from "axios";

export async function spendingByAward(filters: Record<string, unknown>, fields?: string[], sort?: string, order?: string) {
  const url = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
  const payload: any = { filters };
  if (fields) payload.fields = fields;
  if (sort) payload.sort = sort;
  if (order) payload.order = order;
  const res = await axios.post(url, payload);
  return res.data;
}