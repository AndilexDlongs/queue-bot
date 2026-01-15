# Queue Bot Repo Notes (Direct Inspection)

> **Note:** I could not find `AGENTS.md` under `c:\Users\andyd\Desktop\Rohi\queue bot\queue-bot`, so I proceeded with a direct repo inspection.

---

## Why you run `npm run dev` and `npm run dev:server` together

- `npm run dev` starts the Vite frontend dev server (React UI, hot-reload) and serves the client app at `localhost:5173` by default.
- `npm run dev:server` starts the Express API on `localhost:4000` and watches `server/` for changes (`node --watch`).
- The frontend calls `/api/...` endpoints, `vite.config.ts` proxies `/api` to `http://localhost:4000` during dev, so both servers must be running for real data to load.
- If only the frontend is running, API calls fail and the app falls back to mock data from `mockData.ts`.
- If only the backend is running, there is no UI to interact with.

---

# Product Summary (Extremely Extensive)

## What this product is

Queue Bot is a two-part system: a client-facing chat flow that lets customers join and manage a service queue, and an internal manager view that lets staff operate the queue and manage providers. The frontend is a Vite + React app, and the backend is a small Express API backed by a local SQLite database. The product supports multiple businesses (barbershops and GP clinics), with business-specific services, staff (providers), and queue entries.

## Core user journeys

- Clients visit the chat interface, choose a service, select a provider, and join the queue with phone or email verification.
- Clients can check their queue position or leave the queue later using their phone/email.
- Managers use the “App Manager” interface to see the queue per provider, add walk-ins, and mark queue entries as accepted/in-service/done/declined.
- Managers can add new providers and toggle provider availability.
- The system defaults to realistic seed data for two businesses and can be pointed to other business IDs via URL or env vars.

## Architecture at a glance

- The client app is a single-page React app (`main.tsx` → `App.tsx`).
- A shared `QueueProvider` (`QueueContext.tsx`) handles all data fetching, queue mutations, and fallback mock data.
- The backend (`index.js`) exposes REST endpoints for businesses, providers, queue entries, and flow templates.
- SQLite (`queuebot.sqlite`) stores business data, services, providers, and queue entries. It’s seeded from `queuebot-seed.sql` and auto-initialized on server start.

---

# Feature List (Full)

## Client-facing queue bot (chat UI)

- Guided chat flow for selecting a service and provider with wait time previews.
- Join queue with phone or email contact method (demo verification code shown in chat).
- Duplicate detection prevents multiple active entries for the same contact, with options to proceed or check position.
- Queue position lookup by phone/email with estimated wait time and “head to shop” nudges.
- Leave queue flow with confirmation, supports multiple active entries per contact.
- Status-aware messaging for waiting, accepted, and in-service queue states.

## Provider & service selection logic

- Service options drive the initial flow, labels come from service CTA text when present.
- Provider labels adapt to business type (barber vs doctor vs generic provider).
- Only providers offering the selected service are shown.
- Only providers marked available are listed for selection.

## Queue estimation & status handling

- Estimated wait time uses provider average service duration and number of active queue entries.
- Queue positions are computed per provider and exposed as visible IDs.
- Queue status transitions supported: `waiting → accepted → in-service → done`, plus `declined` and `left`.
- Separate logic for walk-ins and online joins.

## Manager view (App Manager)

- Tabbed management interface: salon profile, provider management, and operations.
- Add new providers with work hours, lunch, and average service duration.
- Toggle provider availability (on/off duty).
- View each provider’s active queue sorted by join time.
- Add walk-in clients directly to a provider’s queue.
- Update client status with context-aware buttons (Accept, Start, Done, Decline).

## Data resilience and fallback

- Frontend uses seeded mock data if API fetch fails.
- Each refresh re-hydrates local state from the API where available.
- Business ID is derived from URL path or `VITE_BUSINESS_ID`, allowing multi-tenant testing.

## API and backend

- Health check endpoint for quick service availability checks.
- Business list, business summary (business/services/providers/queue), and flow template endpoints.
- CRUD endpoints for queue entries and provider availability.
- Providers can be created with assigned services in a single transaction.

## Dev ergonomics

- Frontend uses Vite with fast refresh.
- Backend uses `node --watch` for live reload.
- `/api` proxy during dev to avoid CORS and simplify client fetches.

---

# Directory and File Map (with Roles and Links)

## Root

| Path | Role in Project | Links to / Used by |
|---|---|---|
| `.env.example` | Example environment configuration for frontend + server | `QueueContext.tsx` (VITE vars), `index.js` + `index.js` (PORT, DB_PATH) |
| `.eslintignore` | Excludes files from linting | `npm run lint` |
| `.eslintrc.cjs` | ESLint configuration for TypeScript/React | `npm run lint` |
| `.gitignore` | Git ignore rules | `.git` |
| `.prettierignore` | Prettier ignore rules | `npm run format` |
| `.prettierrc.cjs` | Prettier configuration | `npm run format` |
| `index.html` | Vite HTML entry point and mounting root | `main.tsx` |
| `package.json` | Scripts, dependencies, project metadata | All tooling, `npm run dev`, `npm run dev:server` |
| `package-lock.json` | Dependency lockfile for reproducible installs | `npm install` |
| `postcss.config.cjs` | PostCSS config for Tailwind | `tailwind.config.cjs`, `index.css` |
| `tailwind.config.cjs` | Tailwind design tokens mapped to CSS vars | `index.css`, all `*.tsx` |
| `tsconfig.json` | Base TS config for frontend | Vite + TypeScript tooling |
| `tsconfig.node.json` | TS config for Vite config file | `vite.config.ts` |
| `vite.config.ts` | Vite dev server and proxy settings | Frontend fetches `/api` → `index.js` |
| `.git/` | Git metadata | Version control only |
| `node_modules/` | Installed dependencies (React, Express, better-sqlite3, etc.) | Runtime + build tooling |

## `db/`

| Path | Role in Project | Links to / Used by |
|---|---|---|
| `queuebot-seed.sql` | Full schema + seed data | `index.js` via `seedDatabase()` |
| `queuebot.sqlite` | Current SQLite database file | `index.js` via `DB_PATH` (default) |

## `server/`

| Path | Role in Project | Links to / Used by |
|---|---|---|
| `index.js` | Express API routes and business logic | `index.js`, frontend `/api` fetches |
| `index.js` | SQLite setup, seeding, and demo inserts | `queuebot-seed.sql`, `queuebot.sqlite` |

## `src/`

| Path | Role in Project | Links to / Used by |
|---|---|---|
| `main.tsx` | React entry point, mounts app | `App.tsx`, `index.css`, `App.css` |
| `App.tsx` | Route switcher (chat vs manager) and provider wrapper | `Chat.tsx`, `AppManager.tsx`, `QueueContext.tsx` |
| `QueueContext.tsx` | Central data layer and API calls | `index.js` endpoints, `mockData.ts` |
| `mockData.ts` | Seeded mock business, services, providers, queue | Used as fallback in `QueueContext.tsx` |
| `Chat.tsx` | Client chat flow UI and state machine | `src/components/chat/*`, `QueueContext.tsx` |
| `AppManager.tsx` | Manager console UI for staff | `QueueContext.tsx`, `cn.ts` |
| `ChatHeader.tsx` | Chat header with salon details | `QueueContext.tsx` |
| `ChatBubble.tsx` | Message bubble rendering | `Chat.tsx`, `cn.ts` |
| `ChatOption.tsx` | Button options used in chat | `Chat.tsx`, `cn.ts` |
| `ChatInput.tsx` | Bottom input UI for chat | `Chat.tsx` |
| `index.css` | Tailwind base + design tokens + fonts | All UI via Tailwind classes |
| `App.css` | Minimal root layout styles | `main.tsx` |
| `cn.ts` | Classname join helper | `AppManager.tsx`, `src/components/chat/*` |
| `use-mobile.tsx` | Screen-size hook (currently unused) | Available for future responsive logic |

---

# Database Role and Schema

## Database role in the product

- Stores durable business configuration (business profiles and services).
- Stores providers (barbers/doctors), including work hours and availability.
- Stores queue entries and their current status, which drive the live queue UI.
- Stores flow templates (future-facing conversational templates) tied to business types.
- Provides the backend source of truth, the frontend uses this unless the API is unreachable.

## Schema overview (tables, relationships, and usage)

### `flow_templates`

- **Purpose:** Stores serialized flow definitions per business type.
- **Key columns:** `id`, `business_type`, `name`, `version`, `definition`, `created_at`.
- **Relationships:** `businesses.flow_template_id → flow_templates.id`.
- **Used by:** `GET /api/businesses/:businessId/flow` in `index.js`.

### `businesses`

- **Purpose:** Top-level business profile used by both chat and manager UIs.
- **Key columns:** `id`, `name`, `address`, `city`, `phone`, `email`, `opens_at`, `closes_at`, `working_days`, `manager_name`, `manager_phone`, `manager_email`, `business_type`, `flow_template_id`, timestamps.
- **Relationships:** `flow_template_id` references `flow_templates.id`.
- **Used by:** `GET /api/businesses` and `GET /api/businesses/:businessId/summary`.

### `services`

- **Purpose:** Enumerates available services per business (e.g., haircut, consultation).
- **Key columns:** `id`, `business_id`, `key`, `name`, `cta_label`, `default_duration_minutes`, `is_active`.
- **Relationships:** `business_id` references `businesses.id`.
- **Used by:** service selection in `Chat.tsx`, provider-service matching.

### `providers`

- **Purpose:** Staff members who provide services (barbers/doctors).
- **Key columns:** `id`, `business_id`, `name`, `phone`, `email`, `start_time`, `end_time`, `lunch_start`, `lunch_duration_minutes`, `average_service_minutes`, `is_available`, `role`.
- **Relationships:** `business_id` references `businesses.id`.
- **Used by:** provider selection, availability toggles, queue estimation.

### `provider_services`

- **Purpose:** Many-to-many join between providers and services.
- **Key columns:** `provider_id`, `service_id`.
- **Relationships:** `provider_id → providers.id`, `service_id → services.id`.
- **Used by:** backend summary and frontend provider filtering.

### `queue_entries`

- **Purpose:** Live queue data for each provider.
- **Key columns:** `id`, `business_id`, `provider_id`, `service_id`, `name`, `phone`, `email`, `joined_at`, `estimated_at`, `status`, `visible_id`, `notification_sent`, `is_walk_in`.
- **Relationships:** `business_id → businesses.id`, `provider_id → providers.id`, `service_id → services.id`.
- **Used by:** queue display in both chat and manager views, status transitions.

## Status values used in the queue

- **Active statuses:** `waiting`, `accepted`, `in-service`.
- **Final/terminal statuses:** `done`, `declined`, `left`.
- **Used by:** `ACTIVE_STATUSES` and `VALID_STATUSES` in `index.js`, plus filtering logic in `Chat.tsx` and `QueueContext.tsx`.

---

# How to view the current database manually

## Option A: Using the sqlite3 CLI (if installed)

```bash
sqlite3 db/queuebot.sqlite
.tables
.schema
SELECT * FROM businesses;
SELECT * FROM services;
SELECT * FROM providers;
SELECT * FROM queue_entries;