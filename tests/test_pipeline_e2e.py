"""
Integration Test: End-to-End AuditTrace Pipeline
Tests generation, data contract validation, Bronze ingestion, Silver scoring, and Gold mart creation.
"""

from pathlib import Path
import duckdb
import pytest
from run_pipeline import run_pipeline
from config.settings import settings


def test_full_pipeline_run():
    # Run a test batch of 300 events with corrupt injection enabled
    result = run_pipeline(num_events=300, inject_corrupt=True)

    assert result["total_events"] >= 300
    assert result["valid_events"] == 300
    assert result["quarantined"] >= 3
    assert result["elapsed_seconds"] < 10.0

    # Verify Bronze Parquet files exist
    bronze_dir = Path(settings.BRONZE_PATH)
    parquet_files = list(bronze_dir.rglob("*.parquet"))
    assert len(parquet_files) > 0

    # Verify Silver table in DuckDB
    con = duckdb.connect(str(settings.duckdb_path))
    try:
        silver_count = con.execute("SELECT COUNT(*) FROM silver_transactions").fetchone()[0]
        assert silver_count >= 300

        # Verify Gold tables
        fact_count = con.execute("SELECT COUNT(*) FROM fact_transactions").fetchone()[0]
        assert fact_count >= 300

        cust_count = con.execute("SELECT COUNT(*) FROM dim_customers").fetchone()[0]
        assert cust_count > 0

        mch_count = con.execute("SELECT COUNT(*) FROM dim_merchants").fetchone()[0]
        assert mch_count > 0

        loc_count = con.execute("SELECT COUNT(*) FROM dim_locations").fetchone()[0]
        assert loc_count > 0
    finally:
        con.close()
