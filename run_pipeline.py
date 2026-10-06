"""
AuditTrace: End-to-End Pipeline Runner
Runs the full financial data lifecycle:
  1. Synthetic Event Generation
  2. Data Contract & Quality Validation Gate
  3. Dead-Letter Queue (DLQ) Quarantine
  4. Bronze Layer Ingestion (Partitioned Parquet)
  5. Stream Processing & Fraud Detection (Velocity + Haversine Geo-Hop)
  6. Silver Layer Storage (Cleaned DuckDB)
  7. Gold Layer Materialization (Star Schema Fact & Dimensions)
"""

import argparse
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from config.logging_config import configure_logging, get_logger
from config.settings import settings
from lakehouse.star_schema import StarSchemaBuilder
from stream_processor.processor import FinFlowProcessor
from stream_producer.synthetic_generator import SyntheticTransactionGenerator

configure_logging(level=settings.LOG_LEVEL, fmt="console")
logger = get_logger("audittrace.runner")


def run_pipeline(num_events: int = 2500, inject_corrupt: bool = True) -> dict:
    start_time = time.perf_counter()
    print("=" * 65)
    print("   AuditTrace - Financial Transaction Lakehouse Pipeline")
    print("=" * 65)
    print(f"[*] Initializing pipeline run with {num_events:,} events...")

    # Ensure directories exist
    settings.ensure_directories()
    dlq_dir = Path(settings.DLQ_PATH)
    dlq_dir.mkdir(parents=True, exist_ok=True)
    dlq_file = dlq_dir / "invalid_records.jsonl"

    # 1. Generate Transactions
    print(f"[*] Generating {num_events:,} realistic financial transactions...")
    gen = SyntheticTransactionGenerator(num_customers=250, seed=42)
    events = gen.generate_batch(num_events)

    # Optionally inject a few intentionally malformed events to test DLQ
    if inject_corrupt:
        print("[*] Injecting 5 test malformed transactions to verify Dead-Letter Queue (DLQ)...")
        corrupt_samples = [
            # Negative amount
            gen.generate_single_event(),
            # Zero amount
            gen.generate_single_event(),
            # Invalid latitude out of planetary bounds (>90)
            gen.generate_single_event(),
        ]
        corrupt_samples[0].amount = -50.0
        corrupt_samples[1].amount = 0.0
        corrupt_samples[2].latitude = 195.45
        events.extend(corrupt_samples)

    # 2. Data Quality / Contract Gate
    print("[*] Running Data Contract & Quality Validation Gate...")
    valid_events = []
    quarantined_count = 0

    with open(dlq_file, "a", encoding="utf-8") as dlq_out:
        for ev in events:
            reasons = []
            if ev.amount <= 0:
                reasons.append("amount_must_be_positive")
            if not (-90.0 <= ev.latitude <= 90.0 and -180.0 <= ev.longitude <= 180.0):
                reasons.append("geocoords_out_of_bounds")
            if not ev.transaction_id or len(ev.transaction_id) < 10:
                reasons.append("invalid_transaction_id")
            if ev.currency not in {"USD", "EUR", "GBP", "EGP", "SAR", "AED"}:
                reasons.append(f"unsupported_currency_{ev.currency}")

            if reasons:
                quarantined_count += 1
                dlq_record = {
                    "rejected_at": datetime.now(timezone.utc).isoformat(),
                    "rejection_reasons": reasons,
                    "raw_payload": ev.to_dict(),
                }
                import json
                dlq_out.write(json.dumps(dlq_record) + "\n")
            else:
                valid_events.append(ev)

    print(f"[+] Validation complete: {len(valid_events):,} valid | {quarantined_count:,} quarantined to DLQ")

    # 3. Bronze Layer
    print(f"[*] Ingesting {len(valid_events):,} records to Bronze Layer (Parquet partitioned by date)...")
    processor = FinFlowProcessor()
    processor.write_bronze(valid_events)
    print(f"[+] Bronze Layer written to {settings.BRONZE_PATH}")

    # 4. Stream Processing & Fraud Detection -> Silver
    print(f"[*] Executing Fraud Scoring Engine (Velocity + Haversine Distance)...")
    enriched = processor.process_batch(valid_events)

    print(f"[*] Writing {len(enriched):,} cleansed & scored records to Silver Layer (DuckDB)...")
    processor.write_silver(enriched)
    print(f"[+] Silver Layer updated in {settings.DUCKDB_PATH}")

    # 5. Gold Star Schema
    print("[*] Materializing Gold Star Schema (Fact & Dimensions)...")
    schema_builder = StarSchemaBuilder()
    gold_counts = schema_builder.build_marts()

    elapsed = time.perf_counter() - start_time
    throughput = len(events) / elapsed if elapsed > 0 else 0

    fraud_count = sum(1 for e in enriched if e.fraud_predicted)
    fraud_pct = (fraud_count / len(enriched) * 100) if enriched else 0.0

    print("\n" + "=" * 65)
    print("                 PIPELINE EXECUTION SUMMARY")
    print("=" * 65)
    print(f"  Total Ingested Events    : {len(events):,}")
    print(f"  Valid Events Processed   : {len(valid_events):,}")
    print(f"  Quarantined to DLQ       : {quarantined_count:,}")
    print(f"  Flagged Fraud Anomalies  : {fraud_count:,} ({fraud_pct:.2f}%)")
    print(f"  Total Pipeline Latency   : {elapsed:.2f} seconds")
    print(f"  Effective Throughput     : {throughput:,.1f} events/sec (local machine)")
    print("-" * 65)
    print("  Gold Layer Dimensions & Facts:")
    for table_name, row_count in gold_counts.items():
        print(f"    - {table_name:<26}: {row_count:,} rows")
    print("=" * 65)
    print("  [SUCCESS] All Medallion Lakehouse layers populated successfully!\n")

    return {
        "total_events": len(events),
        "valid_events": len(valid_events),
        "quarantined": quarantined_count,
        "fraud_count": fraud_count,
        "elapsed_seconds": elapsed,
        "throughput_eps": throughput,
        "gold_counts": gold_counts,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AuditTrace Financial Lakehouse Pipeline Runner")
    parser.add_argument("--events", type=int, default=2500, help="Number of synthetic events to generate")
    args = parser.parse_args()

    run_pipeline(num_events=args.events)
