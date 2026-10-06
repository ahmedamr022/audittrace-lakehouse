"""
FinFlow Stream Processor
Consumes raw transactions from Kafka, applies fraud detection + enrichment,
writes to Bronze (Parquet) and Silver (DuckDB), and emits fraud alerts.
"""

from __future__ import annotations

import json
import signal
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import polars as pl
import pyarrow as pa
import pyarrow.parquet as pq

from config.logging_config import configure_logging, get_logger
from config.settings import settings
from stream_processor.enricher import FinFlowEnricher
from stream_processor.fraud_detector import compute_fraud_signal
from stream_producer.schemas import EnrichedTransaction, TransactionEvent

configure_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)
logger = get_logger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
#  Bronze Parquet schema
# ──────────────────────────────────────────────────────────────────────────────
BRONZE_SCHEMA = pa.schema([
    pa.field("transaction_id", pa.string()),
    pa.field("timestamp", pa.string()),
    pa.field("account_id", pa.string()),
    pa.field("customer_id", pa.string()),
    pa.field("customer_tier", pa.string()),
    pa.field("card_number_masked", pa.string()),
    pa.field("card_network", pa.string()),
    pa.field("card_type", pa.string()),
    pa.field("merchant_id", pa.string()),
    pa.field("merchant_name", pa.string()),
    pa.field("merchant_category", pa.string()),
    pa.field("merchant_mcc", pa.int32()),
    pa.field("amount", pa.float64()),
    pa.field("currency", pa.string()),
    pa.field("amount_usd", pa.float64()),
    pa.field("channel", pa.string()),
    pa.field("terminal_id", pa.string()),
    pa.field("ip_address", pa.string()),
    pa.field("city", pa.string()),
    pa.field("country", pa.string()),
    pa.field("latitude", pa.float64()),
    pa.field("longitude", pa.float64()),
    pa.field("device_id", pa.string()),
    pa.field("device_os", pa.string()),
    pa.field("is_fraud_synthetic", pa.bool_()),
    pa.field("fraud_pattern", pa.string()),
    pa.field("ingestion_timestamp", pa.string()),
    pa.field("loaded_at", pa.string()),
])


class FinFlowProcessor:
    """
    Main stream processor.

    Consumes events → enriches → detects fraud → writes Bronze/Silver.
    """

    def __init__(
        self,
        bronze_path: Optional[Path] = None,
        silver_path: Optional[Path] = None,
    ) -> None:
        self.bronze_path = bronze_path or settings.bronze_path
        self.silver_path = silver_path or settings.silver_path
        self.bronze_path.mkdir(parents=True, exist_ok=True)
        self.silver_path.mkdir(parents=True, exist_ok=True)

        self.enricher = FinFlowEnricher()
        # customer_id → list of recent tx dicts (for fraud detection)
        self._customer_history: dict[str, list[dict[str, Any]]] = defaultdict(list)

        self._stats = {
            "processed": 0,
            "fraud_detected": 0,
            "bronze_written": 0,
            "silver_written": 0,
            "errors": 0,
        }

    # ──────────────────────────────────────────────────────────────────────────
    #  Core processing
    # ──────────────────────────────────────────────────────────────────────────
    def process_batch(
        self,
        events: list[TransactionEvent],
    ) -> list[EnrichedTransaction]:
        """
        Process a micro-batch of TransactionEvents.

        Steps:
          1. Enrich with customer/merchant context
          2. Run fraud detection
          3. Build EnrichedTransaction objects
          4. Update customer history

        Returns list of EnrichedTransaction.
        """
        enriched: list[EnrichedTransaction] = []
        t_start = time.perf_counter()

        for event in events:
            try:
                tx_dict = event.to_dict()
                cid = event.customer_id

                # Enrich
                enriched_dict = self.enricher.enrich_transaction(tx_dict)

                # Fraud detection
                history = self._customer_history.get(cid, [])
                signal_result = compute_fraud_signal(enriched_dict, history)

                # Update history (keep last 50 transactions)
                history.append(tx_dict)
                if len(history) > 50:
                    history.pop(0)
                self._customer_history[cid] = history

                latency_ms = round((time.perf_counter() - t_start) * 1000, 2)

                enriched_tx = EnrichedTransaction(
                    **tx_dict,
                    velocity_5m_count=len([
                        h for h in history
                        if abs((
                            datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00"))
                            - datetime.fromisoformat(tx_dict["timestamp"].replace("Z", "+00:00"))
                        ).total_seconds()) <= 300
                    ]),
                    velocity_5m_amount=sum(
                        float(h.get("amount", 0))
                        for h in history
                        if abs((
                            datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00"))
                            - datetime.fromisoformat(tx_dict["timestamp"].replace("Z", "+00:00"))
                        ).total_seconds()) <= 300
                    ),
                    distance_from_last_km=(
                        _calc_distance(history[-2], tx_dict) if len(history) >= 2 else 0.0
                    ),
                    risk_score=signal_result.score,
                    fraud_predicted=signal_result.is_fraud,
                    anomaly_reason="; ".join(signal_result.reasons) if signal_result.reasons else "none",
                    processing_latency_ms=latency_ms,
                )

                enriched.append(enriched_tx)
                self._stats["processed"] += 1
                if signal_result.is_fraud:
                    self._stats["fraud_detected"] += 1

            except Exception as exc:  # noqa: BLE001
                logger.error(
                    "Failed to process event",
                    extra={"transaction_id": getattr(event, "transaction_id", "?"), "error": str(exc)},
                )
                self._stats["errors"] += 1

        return enriched

    # ──────────────────────────────────────────────────────────────────────────
    #  Bronze writer (raw Parquet, partitioned by date)
    # ──────────────────────────────────────────────────────────────────────────
    def write_bronze(self, events: list[TransactionEvent]) -> None:
        """Append raw events to date-partitioned Parquet files."""
        if not events:
            return

        loaded_at = datetime.now(timezone.utc).isoformat()

        # Group by date partition
        partitions: dict[str, list[dict]] = defaultdict(list)
        for e in events:
            ts = e.timestamp[:10]  # YYYY-MM-DD
            row = e.to_dict()
            row["loaded_at"] = loaded_at
            partitions[ts].append(row)

        for date_str, rows in partitions.items():
            # Use Polars for fast dict→DataFrame conversion
            df = pl.DataFrame(rows)

            partition_dir = self.bronze_path / f"date={date_str}"
            partition_dir.mkdir(parents=True, exist_ok=True)

            ts_safe = datetime.now(timezone.utc).strftime("%H%M%S%f")
            out_path = partition_dir / f"txns_{ts_safe}.parquet"

            df.write_parquet(str(out_path), compression="snappy")
            self._stats["bronze_written"] += len(rows)

        logger.debug("Bronze write complete", extra={"rows": len(events)})

    # ──────────────────────────────────────────────────────────────────────────
    #  Silver writer (DuckDB)
    # ──────────────────────────────────────────────────────────────────────────
    def write_silver(self, enriched_events: list[EnrichedTransaction]) -> None:
        """Upsert enriched events into DuckDB silver table."""
        if not enriched_events:
            return

        try:
            import duckdb  # local import to avoid hard dep at module level

            db_path = str(settings.duckdb_path)
            rows = [e.to_dict() for e in enriched_events]
            df = pl.DataFrame(rows)

            con = duckdb.connect(db_path)
            con.execute("""
                CREATE TABLE IF NOT EXISTS silver_transactions AS
                SELECT * FROM df WHERE 1=0
            """)
            con.execute("INSERT INTO silver_transactions SELECT * FROM df")
            con.close()

            self._stats["silver_written"] += len(rows)
            logger.debug("Silver write complete", extra={"rows": len(rows)})

        except Exception as exc:  # noqa: BLE001
            logger.error("Silver write failed", extra={"error": str(exc)})

    # ──────────────────────────────────────────────────────────────────────────
    #  Stats
    # ──────────────────────────────────────────────────────────────────────────
    def get_stats(self) -> dict[str, Any]:
        return dict(self._stats)

    # ──────────────────────────────────────────────────────────────────────────
    #  Kafka consumer loop
    # ──────────────────────────────────────────────────────────────────────────
    def run(self) -> None:
        """Start the main Kafka consumer loop."""
        try:
            from kafka import KafkaConsumer
        except ImportError:
            logger.error("kafka-python not installed")
            return

        consumer = KafkaConsumer(
            settings.KAFKA_TOPIC_RAW,
            bootstrap_servers=settings.kafka_bootstrap_list,
            group_id=settings.KAFKA_CONSUMER_GROUP,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        )

        logger.info("Stream processor started", extra={"topic": settings.KAFKA_TOPIC_RAW})

        running = True

        def _stop(signum, frame):
            nonlocal running
            running = False

        signal.signal(signal.SIGINT, _stop)
        signal.signal(signal.SIGTERM, _stop)

        batch: list[TransactionEvent] = []
        last_flush = time.time()

        try:
            while running:
                records = consumer.poll(timeout_ms=1000, max_records=settings.BATCH_SIZE)
                for _, messages in records.items():
                    for msg in messages:
                        try:
                            payload = msg.value.get("payload", msg.value)
                            event = TransactionEvent.from_dict(payload)
                            batch.append(event)
                        except Exception as exc:  # noqa: BLE001
                            logger.warning("Skipping malformed message", extra={"error": str(exc)})

                elapsed = time.time() - last_flush
                if len(batch) >= settings.BATCH_SIZE or elapsed >= settings.FLUSH_INTERVAL_SECONDS:
                    if batch:
                        self.write_bronze(batch)
                        enriched = self.process_batch(batch)
                        self.write_silver(enriched)
                        logger.info("Batch flushed", extra={**self.get_stats()})
                        batch.clear()
                    last_flush = time.time()

        finally:
            consumer.close()
            logger.info("Processor stopped", extra=self.get_stats())


# ──────────────────────────────────────────────────────────────────────────────
#  Helper
# ──────────────────────────────────────────────────────────────────────────────
def _calc_distance(prev: dict, curr: dict) -> float:
    from stream_processor.fraud_detector import haversine_km
    try:
        return round(haversine_km(
            float(prev.get("latitude", 0)),
            float(prev.get("longitude", 0)),
            float(curr.get("latitude", 0)),
            float(curr.get("longitude", 0)),
        ), 3)
    except (TypeError, ValueError):
        return 0.0


def main() -> None:
    settings.ensure_directories()
    processor = FinFlowProcessor()
    processor.run()


if __name__ == "__main__":
    main()
