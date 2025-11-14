# Audit Next

Assurance-grade audit backend that aggregates authoritative internet data sources, performs XBRL/ESEF validation, sanctions screening, risk scoring, and produces a tamper-evident evidence chain.

## Overview

- Purpose: Reduce manual audit work by automating evidence gathering and verification across LEIs, SEC, Companies House, OpenCorporates, and USAspending.
- Tech: TypeScript, Express, axios, Zod, Pino; ES Modules.
- Core: Internet connectors, XBRL/ESEF validation, entity graph enrichment, sampling, risk scoring, and hash-chained evidence.

## Setup

- Requirements: Node.js 18+ and npm
- Install: `npm install`
- Build: `npm run build`
- Dev: `npm run dev` (ESM via ts-node)
- Start: `npm run start` (runs `dist/index.js`)

## Environment

Create `.env` and set keys:

- `PORT` default `3000`
- `USER_AGENT` optional, but recommended for external requests
- `COMPANIES_HOUSE_API_KEY` required for Companies House
- `OPEN_SANCTIONS_API_KEY` required for OpenSanctions
- `OPEN_CORPORATES_API_TOKEN` required for OpenCorporates

Config loader: `src/config.ts`

## Endpoints

- Health
  - `GET /health` → `{ ok: true }`

- GLEIF
  - `GET /lei/search?q=<query>` → GLEIF search results
  - `GET /entity/lei/relationships?lei=<LEI>` → relationship blob from GLEIF (`managing-lou`, `direct-parent`, etc.)

- SEC
  - `GET /sec/companyfacts?cik=<CIK>` → company facts (pads CIK to 10 digits)

- Companies House
  - `GET /companies-house/psc?companyNumber=<number>` → PSC list
  - `GET /companies-house/psc-statements?companyNumber=<number>` → PSC statements

- USAspending
  - `POST /usaspending/spending_by_award` with `{ filters, fields?, sort?, order? }`

- OpenCorporates
  - `GET /opencorporates/search?q=<q>&jurisdictionCode=<opt>` → company search
  - `GET /opencorporates/company?jurisdictionCode=<code>&companyNumber=<number>` → company details

- Sanctions
  - `GET /sanctions/match?name=<name>&country=<opt>` → match results
  - `POST /sanctions/batch` `{ names: string[], country?: string }` → per-name results

- Evidence
  - `GET /evidence` → entire evidence chain
  - `GET /evidence/verify` → chain integrity report

- Sampling
  - `POST /sampling/pps` `{ values: number[], sampleSize: number }` → deterministic and stochastic samples

- Risk
  - `POST /risk/score` `{ name?: string, country?: string, companyNumber?: string }` → `{ score, features }`

- Resolution
  - `POST /resolve` `{ name?: string, lei?: string, cik?: string, companyNumber?: string }` → merged ids and source snippets

- ESEF/XBRL
  - `GET /esef/fetch?url=<xhtml-or-xml-url>` → `{ meta: { hasXbrl, hasIxbrl, factsApprox } }`
  - `POST /esef/validate` `{ url?: string, content?: string }` → `{ hasXbrl, hasIxbrl, factsApprox, schemaRefs, usesEsef, taxonomyVersions, contexts, units, issues }`

- Graph Enrichment
  - `POST /entity/graph/enrich` `{ name?: string, lei?: string, cik?: string, companyNumber?: string }` → `{ nodes, edges, ids, sources, name }`

## Examples (PowerShell)

```powershell
$base = "http://localhost:3000"

# Health
Invoke-RestMethod -Uri "$base/health" -Method Get | ConvertTo-Json -Depth 6

# Validate ESEF from inline content
$content = @"
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:ix="http://www.xbrl.org/2013/inlineXBRL" xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:link="http://www.xbrl.org/2003/linkbase" xmlns:xlink="http://www.w3.org/1999/xlink">
  <head>
    <link:schemaRef xlink:href="https://www.esma.europa.eu/taxonomy/2024-03-20/esef_taxonomy.xsd" xlink:type="simple"/>
  </head>
  <body>
    <ix:nonFraction name="ifrs-full:Revenue" contextRef="c1" unitRef="u1">1000</ix:nonFraction>
    <xbrli:context id="c1"><xbrli:entity><xbrli:identifier scheme="http://www.example.com">ENTITY</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>2024-12-31</xbrli:instant></xbrli:period></xbrli:context>
    <xbrli:unit id="u1"><xbrli:measure>iso4217:EUR</xbrli:measure></xbrli:unit>
  </body>
</html>
"@
Invoke-RestMethod -Uri "$base/esef/validate" -Method Post -ContentType "application/json" -Body (@{content=$content} | ConvertTo-Json) | ConvertTo-Json -Depth 6

# LEI search and graph enrich
$leiRes = Invoke-RestMethod -Uri "$base/lei/search?q=Allianz" -Method Get
$leiId = $leiRes.data[0].id
Invoke-RestMethod -Uri "$base/entity/graph/enrich" -Method Post -ContentType "application/json" -Body (@{lei=$leiId} | ConvertTo-Json) | ConvertTo-Json -Depth 6

# Evidence chain
Invoke-RestMethod -Uri "$base/evidence" -Method Get | ConvertTo-Json -Depth 6
```

## XBRL/ESEF Validation

- Detects XBRL/iXBRL presence and approximates fact counts via `contextRef` occurrences.
- Extracts `link:schemaRef` URIs; flags `missing_schemaRef` when absent.
- Heuristic ESEF detection via ESMA/ESEF taxonomy URL patterns.
- Infers version strings like `2024-03-20` and reports counts of `contexts` and `units`.
- Returns `issues` for missing fundamentals (e.g., `no_contexts`, `no_units`).
- Implementation: `src/services/xbrl.ts` (detect and validate), routed in `src/routes.ts`.

## Entity Graph Enrichment

- Subject node representing the entity; identifier nodes (`lei:<id>`, `cik:<id>`, `ch:<number>`).
- Pulls GLEIF record for provided LEI; emits edges for discovered relationships (e.g., `direct-parent`).
- Returns compact graph: nodes, edges, ids, sources, and optional name.
- Implementation: `src/services/entityResolution.ts`, routed in `src/routes.ts`.

## Evidence Chain

- Tamper-evident chain using SHA-256 over each record and pointer to previous record.
- Endpoints append evidence for auditability; verify with `GET /evidence/verify`.
- Implementation: `src/services/evidence.ts`.

## Connectors

- GLEIF: `src/connectors/gleif.ts`
- SEC: `src/connectors/sec.ts` (pads CIK to 10 digits, sets headers)
- Companies House: `src/connectors/companies_house.ts`
- OpenCorporates: `src/connectors/opencorporates.ts` (requires token)
- USAspending: `src/connectors/usaspending.ts`
- OpenSanctions: `src/connectors/opensanctions.ts` (requires API key)

## Validation & Scripts

- Typecheck: `npm run typecheck`
- Dev server: `npm run dev`
- Production build: `npm run build` then `npm run start`

## Troubleshooting

- SEC remote fetch `403`: Provide a descriptive `USER_AGENT` and respect rate limits; some SEC endpoints block scripted clients.
- Missing API keys: Endpoints for Companies House, OpenSanctions, OpenCorporates will return descriptive errors until keys are set.
- ESEF remote URLs: If the host blocks or is not reachable, use `content` parameter with the XHTML/iXBRL body.