# Setup

## Requirements

- Node.js 18+
- npm

## Install

- `npm install`

## Development

- Backend dev: `npm run dev`
- UI dev: `cd ui && npm install && npm run dev`

## Build and Start

- `npm run build`
- `npm run start`
 - UI build: `cd ui && npm run build` then `npm run preview`

## Environment Variables

- `PORT` default `3000`
- `USER_AGENT` recommended for external requests
- `COMPANIES_HOUSE_API_KEY` required for Companies House endpoints
- `OPEN_SANCTIONS_API_KEY` required for sanctions endpoints
- `OPEN_CORPORATES_API_TOKEN` required for OpenCorporates endpoints

## Configuration

- Config loader: `src/config.ts`
 - UI RBAC: Non-admins have read-only access and masked emails