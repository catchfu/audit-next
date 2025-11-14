import axios from "axios";
export async function spendingByAward(filters, fields, sort, order) {
    const url = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
    const payload = { filters };
    if (fields)
        payload.fields = fields;
    if (sort)
        payload.sort = sort;
    if (order)
        payload.order = order;
    const res = await axios.post(url, payload);
    return res.data;
}
