import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  userAgent: process.env.USER_AGENT || "audit-next/0.1 (+https://example.com)",
  companiesHouseApiKey: process.env.COMPANIES_HOUSE_API_KEY || "",
  openSanctionsApiKey: process.env.OPEN_SANCTIONS_API_KEY || "",
  openCorporatesApiToken: process.env.OPEN_CORPORATES_API_TOKEN || "",
};