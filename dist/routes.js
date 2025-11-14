import express from "express";
import rateLimit from "express-rate-limit";
import { logger } from "./logger.js";
import { searchLei } from "./connectors/gleif.js";
import { getCompanyFacts } from "./connectors/sec.js";
import { getPscStatements, listPsc } from "./connectors/companies_house.js";
import { spendingByAward } from "./connectors/usaspending.js";
import { screenName, screenBatch } from "./services/sanctions.js";
import { resolveEntity } from "./services/entityResolution.js";
import { appendEvidence, getChain, verifyChain } from "./services/evidence.js";
import axios from "axios";
import { detectXbrl } from "./services/xbrl.js";
import { getLeiRecord } from "./connectors/gleif.js";
import { z } from "zod";
import { ocGetCompany, ocSearchCompanies } from "./connectors/opencorporates.js";
import { topK, weightedSample } from "./services/sampling.js";
import { simpleRiskScore } from "./services/risk.js";
export function buildRouter() {
    const router = express.Router();
    const limiter = rateLimit({ windowMs: 60000, max: 120 });
    router.use(limiter);
    router.get("/health", (_req, res) => {
        res.json({ ok: true });
    });
    router.get("/lei/search", async (req, res) => {
        const q = String(req.query.q || "");
        if (!q)
            return res.status(400).json({ error: "q required" });
        const data = await searchLei(q);
        appendEvidence("lei_search", { q, count: data?.data?.length || 0 });
        res.json(data);
    });
    router.get("/sec/companyfacts", async (req, res) => {
        const cik = String(req.query.cik || "");
        if (!cik)
            return res.status(400).json({ error: "cik required" });
        try {
            const data = await getCompanyFacts(cik);
            appendEvidence("sec_companyfacts", { cik });
            res.json(data);
        }
        catch (e) {
            res.status(502).json({ error: String(e?.message || e) });
        }
    });
    router.get("/companies-house/psc-statements", async (req, res) => {
        const companyNumber = String(req.query.companyNumber || "");
        if (!companyNumber)
            return res.status(400).json({ error: "companyNumber required" });
        try {
            const data = await getPscStatements(companyNumber);
            appendEvidence("ch_psc_statements", { companyNumber });
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.get("/companies-house/psc", async (req, res) => {
        const companyNumber = String(req.query.companyNumber || "");
        if (!companyNumber)
            return res.status(400).json({ error: "companyNumber required" });
        try {
            const data = await listPsc(companyNumber);
            appendEvidence("ch_psc", { companyNumber });
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/usaspending/spending_by_award", async (req, res) => {
        const filters = req.body?.filters || {};
        const fields = req.body?.fields;
        const sort = req.body?.sort;
        const order = req.body?.order;
        const data = await spendingByAward(filters, fields, sort, order);
        appendEvidence("usaspending_spending_by_award", { filters });
        res.json(data);
    });
    router.get("/opencorporates/company", async (req, res) => {
        const jurisdictionCode = String(req.query.jurisdictionCode || "");
        const companyNumber = String(req.query.companyNumber || "");
        if (!jurisdictionCode || !companyNumber)
            return res.status(400).json({ error: "jurisdictionCode and companyNumber required" });
        try {
            const data = await ocGetCompany(jurisdictionCode, companyNumber);
            appendEvidence("opencorporates_company", { jurisdictionCode, companyNumber });
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.get("/opencorporates/search", async (req, res) => {
        const q = String(req.query.q || "");
        const jurisdictionCode = req.query.jurisdictionCode ? String(req.query.jurisdictionCode) : undefined;
        if (!q)
            return res.status(400).json({ error: "q required" });
        try {
            const data = await ocSearchCompanies(q, jurisdictionCode);
            appendEvidence("opencorporates_search", { q, jurisdictionCode });
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.get("/sanctions/match", async (req, res) => {
        const name = String(req.query.name || "");
        const country = req.query.country ? String(req.query.country) : undefined;
        if (!name)
            return res.status(400).json({ error: "name required" });
        try {
            const data = await screenName(name, country);
            appendEvidence("sanctions_match", { name, country });
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/sanctions/batch", async (req, res) => {
        const schema = z.object({ names: z.array(z.string()).min(1), country: z.string().optional() });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.errors });
        const { names, country } = parsed.data;
        try {
            const data = await screenBatch(names, country);
            appendEvidence("sanctions_batch", { names, country });
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.get("/esef/fetch", async (req, res) => {
        const url = String(req.query.url || "");
        if (!url)
            return res.status(400).json({ error: "url required" });
        try {
            const response = await axios.get(url, { responseType: "text" });
            const content = String(response.data);
            const meta = detectXbrl(content);
            appendEvidence("esef_fetch", { url, meta });
            res.json({ meta });
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.get("/entity/lei/relationships", async (req, res) => {
        const lei = String(req.query.lei || "");
        if (!lei)
            return res.status(400).json({ error: "lei required" });
        try {
            const record = await getLeiRecord(lei);
            const rel = record?.data?.[0]?.relationships || {};
            appendEvidence("lei_relationships", { lei });
            res.json({ relationships: rel });
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/resolve", async (req, res) => {
        const input = req.body || {};
        const sources = {};
        if (input.name)
            sources["gleif"] = await searchLei(String(input.name));
        const resolved = resolveEntity(input, sources);
        appendEvidence("resolve", { input });
        res.json(resolved);
    });
    router.post("/sampling/pps", async (req, res) => {
        const schema = z.object({ values: z.array(z.number()), sampleSize: z.number().int().positive() });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.errors });
        const { values, sampleSize } = parsed.data;
        const deterministic = topK(values, Math.min(sampleSize, values.length));
        const stochastic = weightedSample(values, Math.min(sampleSize, values.length));
        appendEvidence("sampling_pps", { sampleSize });
        res.json({ deterministic, stochastic });
    });
    router.post("/risk/score", async (req, res) => {
        const schema = z.object({ name: z.string().optional(), country: z.string().optional(), companyNumber: z.string().optional() });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.errors });
        const data = await simpleRiskScore(parsed.data);
        appendEvidence("risk_score", parsed.data);
        res.json(data);
    });
    router.get("/evidence", (_req, res) => {
        res.json({ chain: getChain() });
    });
    router.get("/evidence/verify", (_req, res) => {
        res.json(verifyChain());
    });
    router.use((err, _req, res, _next) => {
        logger.error({ err });
        res.status(500).json({ error: "internal_error" });
    });
    return router;
}
