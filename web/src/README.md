# Risk & Fraud Intelligence — Lakehouse Integration Guide

> **For the AI agent connecting this UI to the real lakehouse.**
> The UI is complete. You only need to (1) expose the endpoints below from the lakehouse and (2) flip the config. Do **not** change component files.

---

## 1. Go live in 3 steps

1. Open `utils/lakehouseConfig.ts`
2. Set `mode: 'rest'`, `baseUrl: 'https://<your-api>'`, `apiKey: '<token>'` (sent as `Authorization: Bearer`)
3. Implement each endpoint in section 3 so it returns JSON **exactly** matching the TypeScript type in `types/dashboard.ts`

That's it — every widget already has loading, error (with Retry), empty, and auto-refresh states.

---

## 2. Architecture

```
types/dashboard.ts            ← overview data contracts (source of truth)
types/operations.ts           ← contracts for rules, alerts, lakehouse tables, sync, settings, transactions
utils/lakehouseConfig.ts      ← mode / baseUrl / apiKey / polling intervals / endpoint paths
utils/lakehouseClient.ts      ← `lakehouseApi` — the ONLY place that calls fetch() (GET/POST/PATCH/PUT/DELETE)
utils/mockGenerators.ts       ← mock-only: evolving risk-map snapshot, transactions, live feed
utils/mockStore.ts            ← mock-only: in-memory store so every mutation button works offline
data/dashboardMock.ts, data/operationsMock.ts ← mock-only sample payloads (same shape as real API)
data/apiDocs.ts               ← endpoint list rendered on the in-app "Integration Docs" page
hooks/useLakehouseQuery.ts    ← generic fetch + polling + abort + keep-previous-data + optimistic mutate
hooks/useDashboardQueries.ts  ← overview hooks;  hooks/useOperationsQueries.ts ← page hooks
contexts/StreamContext.tsx    ← "Live Stream / Paused" toggle — pauses all polling
components/map/*              ← real world map (Natural Earth topology, ISO numeric ids), choropleth + flows
pages/*                       ← Overview, Transactions, Fraud Rules, Lakehouse, Patterns, Geo Risk, Alerts, Docs, Settings, Cloud Sync
```

### Routes
`/` Overview · `/transactions?q=&decision=&region=&page=` · `/fraud-rules?pattern=` · `/lakehouse` · `/patterns` · `/geo-risk?region=&country=` · `/alerts` · `/docs` · `/settings` · `/sync` · `/signed-out`

### Map data
`RiskMapData.countries[].id` must be the ISO 3166-1 **numeric** code as a 3-digit string (`"840"` = US, `"784"` = AE) — it is joined against the world geometry to shade each country by `riskScore`. Region markers use `[longitude, latitude]`. Poll interval: `refreshIntervals.riskMap`.

### Mutations (all optimistic, rolled back on error)
`POST /fraud/rules`, `PATCH /fraud/rules/:id`, `DELETE /fraud/rules/:id`, `PATCH /alerts/:id {status}`, `POST /lakehouse/tables/:id/refresh`, `POST /sync/jobs/:id/run`, `PATCH /sync/jobs/:id`, `PUT /settings`, `POST /notifications/read-all`, `POST /auth/logout`. The full list with return types is in `data/apiDocs.ts` and on the in-app Docs page.

Polling intervals per widget live in `lakehouseConfig.refreshIntervals` (ms).
For true push streaming (WebSocket/SSE) of the live feed, replace `lakehouseApi.getLiveFeed` with a subscription and keep the return type `LiveTransaction[]`.

---

## 3. Endpoint contract

All `GET` unless noted. All responses `application/json`.

| Widget | Endpoint | Returns (type) | Suggested lakehouse source (gold layer) |
|---|---|---|---|
| KPI strip (5 cards) | `/api/v1/metrics/kpis` | `KpiMetric[]` | `gold.agg_kpis_daily` |
| Real-Time Transaction Activity | `/api/v1/transactions/activity?range=1H\|6H\|24H\|7D` | `ActivitySeries` | `gold.agg_transactions_by_bucket` |
| Fraud Risk Radar | `/api/v1/fraud/radar` | `FraudRadar` | `gold.fraud_model_metrics`, `gold.active_risk_signals`, `gold.risk_alerts` |
| Risk Distribution | `/api/v1/risk/distribution` | `RiskDistributionItem[]` | `gold.fct_transactions` (risk_level) |
| Transaction Decision | `/api/v1/transactions/decisions` | `TransactionDecisionSummary` | `gold.fct_transactions` (decision) |
| Global Transaction Risk Map | `/api/v1/risk/geo` | `RiskMapData` | `gold.agg_risk_by_region`, `gold.agg_cross_region_flows` |
| Top Fraud Patterns | `/api/v1/fraud/patterns?limit=5` | `FraudPattern[]` | `gold.agg_fraud_patterns` |
| Pipeline Health | `/api/v1/pipeline/health` | `PipelineMetric[]` | Kafka lag, stream throughput, table freshness, dbt run results, Great Expectations results |
| Live Transaction Feed | `/api/v1/transactions/live?limit=5` | `LiveTransaction[]` (newest first) | `silver.transactions_stream` / Redis |
| Local Infrastructure | `/api/v1/infrastructure/status` | `InfraService[]` | Service health checks (Kafka, PostgreSQL, Redis, Airflow, DuckDB) |
| Live Stream pill | `/api/v1/stream/status` | `StreamStatus` | Stream consumer metrics |
| Notifications bell | `/api/v1/notifications` | `AppNotification[]` | `gold.risk_alerts` |
| Mark all read | `POST /api/v1/notifications/read-all` | `204` | — |
| Avatar | `/api/v1/me` | `UserProfile` | auth / users table |
| Search bar | `/api/v1/search?q=` | `SearchResult[]` | transactions, accounts, countries |

### Field rules
- **Percentages** are numbers 0–100 (`1.82`, not `0.0182`).
- **KpiMetric.format**: `compact` (2.84M) · `percent` · `currency` (needs `currency`) · `milliseconds`.
- **KpiMetric.isPositive** = whether the change is good (Fraud Risk going *down* → `true`). `deltaPercent: 0` hides the delta.
- **KpiMetric.id** must be one of: `total_transactions`, `fraud_risk`, `blocked_value`, `avg_processing`, `data_quality`.
- **ActivitySeries.points[].label** is the x-axis label; `liveLabel` must equal one of the labels (the "LIVE NOW" marker) or `null`.
- **MapRegion.coordinates** = `[longitude, latitude]`. `MapFlow.from/to` reference `MapRegion.id`.
- **status / severity / decision** values are case-sensitive enums — see `types/dashboard.ts`.
- **Icon keys** (`SignalIcon`, `PipelineIcon`, `InfraIcon`) map to icons in `components/dashboard/iconRegistry.tsx`; add a key there if you add a new kind.
- **Timestamps** are ISO-8601 strings.
- Risk score colors: `< 40` normal, `40–79` review (amber), `≥ 80` declined (red).

### Example SQL (adapt to your engine)

```sql
-- /api/v1/risk/distribution
SELECT risk_level AS level,
       COUNT(*) AS count,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS percent
FROM gold.fct_transactions
WHERE event_ts >= now() - INTERVAL 24 HOURS
GROUP BY risk_level;

-- /api/v1/transactions/activity?range=24H
SELECT date_trunc('hour', event_ts) AS timestamp,
       strftime(date_trunc('hour', event_ts), '%H:%M') AS label,
       COUNT(*) FILTER (WHERE decision = 'Approved') AS approved,
       COUNT(*) FILTER (WHERE decision = 'Review')   AS review,
       COUNT(*) FILTER (WHERE decision = 'Declined') AS declined
FROM gold.fct_transactions
WHERE event_ts >= now() - INTERVAL 24 HOURS
GROUP BY 1, 2 ORDER BY 1;

-- /api/v1/transactions/live?limit=5
SELECT transaction_uuid AS id, event_ts AS timestamp, transaction_id AS transactionId,
       country_code AS region, amount, currency, risk_score AS riskScore, decision
FROM silver.transactions_stream
ORDER BY event_ts DESC LIMIT 5;
```

---

## 4. Design tokens
Sky-blue & white theme defined in `tailwind.config.js` (`brand-50…900`, `ink`, `line`, `canvas`, `review`, `declined`, `critical`) and gradient helpers in `index.css` (`.brand-gradient`, `.brand-bar`, `.brand-chip`, `.brand-tint`). Hex mirrors for SVG/charts live in `utils/statusStyles.ts`.
