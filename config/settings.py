"""
FinFlow Lakehouse – Central Configuration
All settings are driven by environment variables (or a .env file).
Uses Pydantic BaseSettings for type-safe, validated configuration.
"""

from pathlib import Path
from functools import lru_cache
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─────────────────────────────────────────
    #  Kafka
    # ─────────────────────────────────────────
    KAFKA_BOOTSTRAP_SERVERS: str = Field(
        default="localhost:9092",
        description="Comma-separated Kafka bootstrap server list",
    )
    KAFKA_TOPIC_RAW: str = Field(
        default="audittrace.raw.transactions",
        description="Topic for raw transaction events",
    )
    KAFKA_TOPIC_ENRICHED: str = Field(
        default="audittrace.enriched.transactions",
        description="Topic for enriched transaction events",
    )
    KAFKA_TOPIC_FRAUD_ALERTS: str = Field(
        default="audittrace.fraud.alerts",
        description="Topic for fraud alert events",
    )
    KAFKA_CONSUMER_GROUP: str = Field(
        default="audittrace-processor-group",
        description="Consumer group ID for the stream processor",
    )
    KAFKA_MAX_POLL_RECORDS: int = Field(
        default=500,
        description="Maximum records per Kafka poll",
    )

    # ─────────────────────────────────────────
    #  Lakehouse paths
    # ─────────────────────────────────────────
    BRONZE_PATH: str = Field(
        default="data/lakehouse/bronze",
        description="Bronze layer root directory (raw Parquet)",
    )
    SILVER_PATH: str = Field(
        default="data/lakehouse/silver",
        description="Silver layer root directory (DuckDB cleaned)",
    )
    GOLD_PATH: str = Field(
        default="data/lakehouse/gold",
        description="Gold layer root directory (Star Schema marts)",
    )
    DLQ_PATH: str = Field(
        default="data/lakehouse/dlq",
        description="Dead-letter queue path for failed records",
    )
    DUCKDB_PATH: str = Field(
        default="data/lakehouse/silver/audittrace.duckdb",
        description="Path to the DuckDB database file",
    )

    # ─────────────────────────────────────────
    #  Processing
    # ─────────────────────────────────────────
    BATCH_SIZE: int = Field(
        default=200,
        description="Number of events per processing micro-batch",
        ge=1,
        le=10_000,
    )
    FLUSH_INTERVAL_SECONDS: float = Field(
        default=5.0,
        description="Max seconds before forcing a batch flush",
    )

    # ─────────────────────────────────────────
    #  Fraud detection thresholds
    # ─────────────────────────────────────────
    FRAUD_VELOCITY_WINDOW_MINUTES: int = Field(
        default=5,
        description="Rolling window (minutes) for velocity scoring",
        ge=1,
        le=60,
    )
    FRAUD_MAX_SPEED_KMH: float = Field(
        default=900.0,
        description="Max realistic travel speed (km/h) for impossible-travel check",
        ge=100.0,
        le=1200.0,
    )
    FRAUD_VELOCITY_TX_THRESHOLD: int = Field(
        default=5,
        description="Transaction count within window that triggers high velocity score",
    )
    FRAUD_SCORE_THRESHOLD: float = Field(
        default=0.65,
        description="Minimum fraud score to emit a fraud alert",
        ge=0.0,
        le=1.0,
    )

    # ─────────────────────────────────────────
    #  PostgreSQL (Airflow metadata)
    # ─────────────────────────────────────────
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_DB: str = Field(default="finflow")
    POSTGRES_USER: str = Field(default="finflow")
    POSTGRES_PASSWORD: str = Field(default="finflow123")

    # ─────────────────────────────────────────
    #  Redis
    # ─────────────────────────────────────────
    REDIS_HOST: str = Field(default="localhost")
    REDIS_PORT: int = Field(default=6379)

    # ─────────────────────────────────────────
    #  Logging
    # ─────────────────────────────────────────
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json", description="'json' or 'text'")

    # ─────────────────────────────────────────
    #  Derived helpers
    # ─────────────────────────────────────────
    @property
    def bronze_path(self) -> Path:
        return Path(self.BRONZE_PATH)

    @property
    def silver_path(self) -> Path:
        return Path(self.SILVER_PATH)

    @property
    def gold_path(self) -> Path:
        return Path(self.GOLD_PATH)

    @property
    def dlq_path(self) -> Path:
        return Path(self.DLQ_PATH)

    @property
    def duckdb_path(self) -> Path:
        return Path(self.DUCKDB_PATH)

    @property
    def kafka_bootstrap_list(self) -> list[str]:
        return [s.strip() for s in self.KAFKA_BOOTSTRAP_SERVERS.split(",")]

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"LOG_LEVEL must be one of {allowed}")
        return upper

    def ensure_directories(self) -> None:
        """Create all lakehouse directories if they don't exist."""
        for path in [self.bronze_path, self.silver_path, self.gold_path, self.dlq_path]:
            path.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()


# Module-level singleton for convenient imports
settings = get_settings()
