# API Reference

Base URL: `http://localhost:3000`

## Health

- `GET /health` → `{ ok: true }`

## GLEIF

- `GET /lei/search?q=<query>`
- `GET /entity/lei/relationships?lei=<LEI>`

## SEC

- `GET /sec/companyfacts?cik=<CIK>`

## Companies House

- `GET /companies-house/psc?companyNumber=<number>`
- `GET /companies-house/psc-statements?companyNumber=<number>`

## USAspending

- `POST /usaspending/spending_by_award`
  - Body: `{ filters, fields?, sort?, order? }`

## OpenCorporates

- `GET /opencorporates/search?q=<q>&jurisdictionCode=<opt>`
- `GET /opencorporates/company?jurisdictionCode=<code>&companyNumber=<number>`

## Sanctions

- `GET /sanctions/match?name=<name>&country=<opt>`
- `POST /sanctions/batch`
  - Body: `{ names: string[], country?: string }`

## Evidence

- `GET /evidence`
- `GET /evidence/verify`

## Sampling

- `POST /sampling/pps`
  - Body: `{ values: number[], sampleSize: number }`

## Risk

- `POST /risk/score`
  - Body: `{ name?: string, country?: string, companyNumber?: string }`

## Resolution

- `POST /resolve`
  - Body: `{ name?: string, lei?: string, cik?: string, companyNumber?: string }`

## ESEF/XBRL

- `GET /esef/fetch?url=<xhtml-or-xml-url>`
- `POST /esef/validate`
  - Body: `{ url?: string, content?: string }`

## Graph Enrichment

- `POST /entity/graph/enrich`
  - Body: `{ name?: string, lei?: string, cik?: string, companyNumber?: string }`