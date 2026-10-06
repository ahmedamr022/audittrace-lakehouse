# AuditTrace

> A local-first financial transaction lakehouse with automated fraud surveillance, Medallion storage, and dimensional modeling.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-1.1+-FFF000?style=flat&logo=duckdb&logoColor=black)](https://duckdb.org/)
[![Polars](https://img.shields.io/badge/Polars-1.0+-CD792C?style=flat&logo=polars&logoColor=white)](https://pola.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

In modern financial payment networks, transactions must be audited without data loss, validated against strict data contracts, and screened for fraud in near real-time.

**AuditTrace** is an end-to-end data engineering pipeline designed to handle the full lifecycle of financial card transactions:
1. **Synthetic Generation**: Simulates realistic ISO-8583 payment streams across multiple currencies (`USD`, `EUR`, `GBP`, `EGP`, `SAR`, `AED`), merchant categories, and realistic fraud attack patterns.
2. **Quality Gates & Quarantine (DLQ)**: Validates incoming records against data contracts before ingestion; corrupt or out-of-bounds payloads are isolated into a Dead-Letter Queue (`invalid_records.jsonl`).
3. **Medallion Lakehouse Storage**:
   - **Bronze**: Raw, immutable, append-only Parquet files partitioned by date (`year=YYYY/month=MM/`).
   - **Silver**: Cleansed, deduplicated, currency-normalized records in DuckDB with real-time fraud scoring.
   - **Gold**: Dimensional Star Schema (`fact_transactions`, `dim_customers`, `dim_merchants`, `dim_dates`, `dim_locations`, `agg_daily_fraud_summary`).
4. **Operations & Surveillance UI**: A local Streamlit dashboard for real-time risk inspection, table querying, and DLQ diagnostics.

---

## Architecture

```
[ Financial Sources: POS, Mobile, Web, ATM ]
                     │
                     ▼
       [ Data Contract Validation Gate ]
                     │
            ┌────────┴────────┐
            │                 │
      (Valid Records)   (Malformed Records)
            │                 │
            ▼                 ▼
     ┌──────────────┐  ┌──────────────┐
     │ Bronze Layer │  │  DLQ Folder  │
     │(Raw Parquet) │  │(Quarantine)  │
     └──────┬───────┘  └──────────────┘
            │
            ▼
     ┌──────────────┐
     │ Silver Layer │  <── (Velocity 5-min Window + Haversine Speed Check)
     │ (Cleaned DB) │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │  Gold Layer  │  <── (Star Schema: Fact & Dimensions)
     │(Marts/OLAP)  │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │  Dashboard   │  (Streamlit UI + SQL Explorer)
     └──────────────┘
```

---

## Key Engineering Decisions

### 1. Why DuckDB + Polars instead of heavy distributed clusters?
For single-node batch and streaming analytics under millions of transactions, managing an Apache Spark cluster or distributed warehouse introduces significant operational overhead (JVM tuning, memory serialization, connection timeouts). 
- **DuckDB** provides zero-dependency, in-process columnar execution with full SQL compliance.
- **Polars** provides multithreaded, zero-copy Arrow data transformations.
- The pipeline runs 100% locally with zero cloud bills, while maintaining strict analytical parity with production Lakehouse systems.

### 2. Dead-Letter Queue (DLQ) for Contract Enforcement
Instead of failing an entire ingestion batch when an invalid payload arrives (e.g. negative amount, coordinates outside planetary bounds, corrupt currency), AuditTrace routes malformed records to `data/lakehouse/dlq/invalid_records.jsonl` along with the timestamp and specific rejection reasons. Valid records proceed uninterrupted.

### 3. Explainable Fraud Detection Rules
Rather than using opaque machine learning models, fraud detection implements deterministic, auditable business rules:
- **Velocity Burst Check**: Tracks card transaction counts and rolling sum within a 5-minute sliding window. Exceeding thresholds flags a `VELOCITY_SURGE`.
- **Impossible Travel (Haversine Formula)**: Calculates great-circle distance between consecutive transactions for the same customer. If the required physical transit speed exceeds realistic commercial flight limits (>850 km/h), it flags `IMPOSSIBLE_TRAVEL`.
- **High-Risk MCC & Off-Hours**: Evaluates merchant category codes (e.g. crypto gateways, online gambling) during late-night hours.

---

## Measured Local Hardware Benchmarks

All metrics below are measured directly on a local development machine using the reproducible benchmark script (`scripts/benchmark.py`).

- **OS**: Windows 10 (64-bit)
- **CPU**: AMD Ryzen (16 logical cores)
- **RAM**: 16 GB DDR4
- **Python**: 3.11.9

| Batch Size | Execution Time | Processing Throughput | Bronze Parquet Size |
| :--- | :--- | :--- | :--- |
| **1,000 events** | **0.83 sec** | **1,210 events/sec** | 423.4 KB |
| **5,000 events** | **1.65 sec** | **3,026 events/sec** | 912.5 KB |
| **10,000 events** | **3.12 sec** | **3,205 events/sec** | 1,820.0 KB |

*To reproduce these numbers on your machine, run `python scripts/benchmark.py`.*

---

## Project Structure

```text
audittrace-lakehouse/
├── config/
│   ├── settings.py                # Environment-driven Pydantic configuration
│   └── logging_config.py          # Structured logging
├── stream_producer/
│   ├── schemas.py                 # ISO-8583 payment data contracts
│   └── synthetic_generator.py     # Deterministic transaction generator
├── stream_processor/
│   ├── fraud_detector.py          # Haversine & velocity algorithms
│   └── processor.py               # Stream & batch processor
├── lakehouse/
│   └── star_schema.py             # Gold Layer dimensional modeler
├── dashboard/
│   └── app.py                     # Streamlit operations dashboard
├── scripts/
│   └── benchmark.py               # Local hardware benchmark suite
├── tests/
│   ├── test_fraud_detector.py     # Unit tests for geospatial and velocity logic
│   └── test_pipeline_e2e.py       # Full integration test suite
├── docker/
│   └── docker-compose.yml         # Optional containerized stack (Kafka, Postgres)
├── run_pipeline.py                # Single-command end-to-end runner
├── requirements.txt               # Pinned dependencies
└── README.md
```

---

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/ahmedamr022/audittrace-lakehouse.git
cd audittrace-lakehouse
```

### 2. Set up virtual environment
```bash
python -m venv .venv

# Windows:
.\.venv\Scripts\activate

# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Run the pipeline
Execute a complete batch of 2,500 transactions (generates raw data, validates quality gates, updates Bronze/Silver/Gold layers):
```bash
python run_pipeline.py --events 2500
```

### 4. Run tests
```bash
python -m pytest -v
```

### 5. Launch the Operations Dashboard
```bash
streamlit run dashboard/app.py
```
Open your browser at `http://localhost:8501` to view live transaction metrics, inspect fraud anomalies, and run custom SQL queries against the Gold Star Schema.

---

## Data Model (Star Schema)

The analytical Gold Layer implements a Kimball-style dimensional model inside DuckDB:

- **`fact_transactions`**: Grain is one financial transaction. Measures include `amount_local`, `amount_usd`, `risk_score`, and foreign keys to all dimensions.
- **`dim_customers`**: Customer profile, home location, card tier, and activity timestamps.
- **`dim_merchants`**: Merchant name, category code (MCC), and business risk tier.
- **`dim_dates`**: Standard calendar dimension (year, month, day, day of week, weekend flag).
- **`dim_locations`**: City, country, and geographic center coordinates.
- **`agg_daily_fraud_summary`**: Aggregated rollups of daily transaction volume, fraud rate percentage, and anomaly breakdowns.

---

## Interview Talking Points

When discussing this project in technical interviews:
1. **Idempotency & Deduplication**: Explain how transactions are deduplicated on `transaction_id` during the Silver layer upsert to guarantee exact-once semantics in downstream marts.
2. **Defensive Ingestion**: Discuss how the Dead-Letter Queue isolates corrupt data without taking down the pipeline, maintaining high availability for financial streams.
3. **Columnar Performance**: Detail why Snappy-compressed Parquet was chosen for Bronze storage (preserving column pruning and predicate pushdown benefits for analytical queries).
4. **Geospatial Math**: Explain the Haversine formula implementation for detecting impossible travel speeds between international card authorizations.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
