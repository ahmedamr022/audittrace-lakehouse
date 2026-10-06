"""
FinFlow Kafka Producer
Reads TransactionEvents from the SyntheticTransactionGenerator and publishes
them to Kafka using JSON serialization (Avro-compatible envelope).
"""

import json
import signal
import sys
import time
from datetime import datetime, timezone
from typing import Optional

from kafka import KafkaProducer
from kafka.errors import KafkaError, NoBrokersAvailable

from config.logging_config import configure_logging, get_logger
from config.settings import settings
from stream_producer.schemas import TransactionEvent
from stream_producer.synthetic_generator import SyntheticTransactionGenerator

configure_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)
logger = get_logger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
#  Avro-style schema envelope (lightweight, no Schema Registry dependency)
# ──────────────────────────────────────────────────────────────────────────────
SCHEMA_VERSION = "1.0.0"
SCHEMA_NAME = "com.finflow.transaction.TransactionEvent"


def _wrap_envelope(event: TransactionEvent) -> dict:
    """Wrap a TransactionEvent in a schema envelope for downstream compatibility."""
    return {
        "schema": SCHEMA_NAME,
        "schema_version": SCHEMA_VERSION,
        "produced_at": datetime.now(timezone.utc).isoformat(),
        "payload": event.to_dict(),
    }


def _json_serializer(obj: dict) -> bytes:
    return json.dumps(obj, default=str).encode("utf-8")


def _key_serializer(key: str) -> bytes:
    return key.encode("utf-8")


def _on_send_success(record_metadata) -> None:
    logger.debug(
        "Message delivered",
        extra={
            "topic": record_metadata.topic,
            "partition": record_metadata.partition,
            "offset": record_metadata.offset,
        },
    )


def _on_send_error(exc: Exception) -> None:
    logger.error("Message delivery failed", extra={"error": str(exc)})


class FinFlowProducer:
    """Kafka producer that streams synthetic transactions to the raw topic."""

    def __init__(
        self,
        bootstrap_servers: Optional[str] = None,
        topic: Optional[str] = None,
    ) -> None:
        self._servers = bootstrap_servers or settings.KAFKA_BOOTSTRAP_SERVERS
        self._topic = topic or settings.KAFKA_TOPIC_RAW
        self._producer: Optional[KafkaProducer] = None
        self._running = False
        self._stats = {"sent": 0, "errors": 0, "fraud": 0}

    def _create_producer(self) -> KafkaProducer:
        return KafkaProducer(
            bootstrap_servers=self._servers,
            value_serializer=_json_serializer,
            key_serializer=_key_serializer,
            acks="all",
            retries=5,
            max_in_flight_requests_per_connection=1,
            enable_idempotence=True,
            compression_type="gzip",
            batch_size=16_384,
            linger_ms=10,
            request_timeout_ms=30_000,
        )

    def connect(self, retries: int = 10, backoff: float = 3.0) -> None:
        for attempt in range(1, retries + 1):
            try:
                self._producer = self._create_producer()
                logger.info(
                    "Kafka producer connected",
                    extra={"servers": self._servers, "topic": self._topic},
                )
                return
            except NoBrokersAvailable:
                logger.warning(
                    f"Kafka not reachable (attempt {attempt}/{retries}) – retrying in {backoff}s"
                )
                time.sleep(backoff)
        raise RuntimeError(
            f"Could not connect to Kafka after {retries} attempts: {self._servers}"
        )

    def send(self, event: TransactionEvent) -> None:
        if self._producer is None:
            raise RuntimeError("Producer not connected. Call connect() first.")

        envelope = _wrap_envelope(event)
        key = event.customer_id  # Partition by customer for ordering

        future = self._producer.send(
            self._topic,
            key=key,
            value=envelope,
        )
        future.add_callback(_on_send_success)
        future.add_errback(_on_send_error)

        self._stats["sent"] += 1
        if event.is_fraud_synthetic:
            self._stats["fraud"] += 1

    def flush(self) -> None:
        if self._producer:
            self._producer.flush(timeout=10)

    def close(self) -> None:
        if self._producer:
            self.flush()
            self._producer.close()
            logger.info("Kafka producer closed", extra=self._stats)

    def run_stream(
        self,
        interval_sec: float = 0.1,
        max_events: Optional[int] = None,
    ) -> None:
        """Stream live synthetic transactions until interrupted."""
        generator = SyntheticTransactionGenerator(num_customers=300, seed=42)
        self._running = True
        count = 0

        def _shutdown(signum, frame):
            logger.info("Shutdown signal received")
            self._running = False

        signal.signal(signal.SIGINT, _shutdown)
        signal.signal(signal.SIGTERM, _shutdown)

        logger.info(
            "Starting live transaction stream",
            extra={"interval_sec": interval_sec, "max_events": max_events or "∞"},
        )

        try:
            for event in generator.stream_live(interval_sec=interval_sec):
                if not self._running:
                    break
                self.send(event)
                count += 1

                if count % 100 == 0:
                    logger.info(
                        "Producer heartbeat",
                        extra={
                            "total_sent": self._stats["sent"],
                            "fraud_sent": self._stats["fraud"],
                            "fraud_rate_pct": round(
                                self._stats["fraud"] / max(self._stats["sent"], 1) * 100, 2
                            ),
                        },
                    )

                if max_events and count >= max_events:
                    logger.info(f"Reached max_events limit ({max_events})")
                    break
        finally:
            self.close()


# ──────────────────────────────────────────────────────────────────────────────
#  Entry point
# ──────────────────────────────────────────────────────────────────────────────
def main() -> None:
    producer = FinFlowProducer()
    producer.connect()
    producer.run_stream(interval_sec=0.05)


if __name__ == "__main__":
    main()
