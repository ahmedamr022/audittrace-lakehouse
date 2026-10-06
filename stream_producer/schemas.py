"""
FinFlow Schemas: ISO-8583 / Enterprise Banking Transaction Contracts
Defines standardized data contracts and event envelopes.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import json
import uuid

@dataclass
class LocationCoords:
    city: str
    country: str
    latitude: float
    longitude: float

@dataclass
class TransactionEvent:
    transaction_id: str
    timestamp: str
    account_id: str
    customer_id: str
    customer_tier: str
    card_number_masked: str
    card_network: str
    card_type: str
    merchant_id: str
    merchant_name: str
    merchant_category: str
    merchant_mcc: int
    amount: float
    currency: str
    amount_usd: float
    channel: str
    terminal_id: str
    ip_address: str
    city: str
    country: str
    latitude: float
    longitude: float
    device_id: str
    device_os: str
    is_fraud_synthetic: bool = False
    fraud_pattern: str = "normal"
    ingestion_timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TransactionEvent":
        return cls(**data)

@dataclass
class EnrichedTransaction(TransactionEvent):
    velocity_5m_count: int = 0
    velocity_5m_amount: float = 0.0
    distance_from_last_km: float = 0.0
    speed_kmh: float = 0.0
    risk_score: float = 0.0
    fraud_predicted: bool = False
    anomaly_reason: str = "none"
    processing_latency_ms: float = 0.0
