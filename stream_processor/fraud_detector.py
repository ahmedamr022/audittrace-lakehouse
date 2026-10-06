"""
FinFlow Fraud Detector
Implements haversine geo-hop impossible-travel detection and velocity-based
anomaly scoring. All functions are pure (no I/O) for easy unit testing.
"""

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

# ──────────────────────────────────────────────────────────────────────────────
#  Constants
# ──────────────────────────────────────────────────────────────────────────────
EARTH_RADIUS_KM: float = 6_371.0
DEFAULT_MAX_SPEED_KMH: float = 900.0  # Max realistic sub-sonic aircraft speed

# MCC codes considered high-risk
HIGH_RISK_MCC: set[int] = {
    6051,  # Cryptocurrency / quasi-cash
    7995,  # Gambling
    5944,  # Jewellery / Luxury (high-value fencing risk)
    6011,  # ATM cash
    6010,  # Manual cash disbursement
    4829,  # Wire transfer money order
}

# Merchant categories considered critical
CRITICAL_CATEGORIES: set[str] = {"Cryptocurrency", "Gambling"}


# ──────────────────────────────────────────────────────────────────────────────
#  Data contract
# ──────────────────────────────────────────────────────────────────────────────
@dataclass
class FraudSignal:
    """Result of fraud detection on a single transaction."""

    is_fraud: bool
    score: float  # 0.0 (clean) → 1.0 (definitely fraud)
    reasons: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.score = max(0.0, min(1.0, self.score))


# ──────────────────────────────────────────────────────────────────────────────
#  Haversine distance
# ──────────────────────────────────────────────────────────────────────────────
def haversine_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Calculate the great-circle distance between two points on Earth (km).

    Uses the Haversine formula which is numerically stable for small distances.

    Args:
        lat1, lon1: Origin coordinates (degrees).
        lat2, lon2: Destination coordinates (degrees).

    Returns:
        Distance in kilometres.

    Example:
        >>> round(haversine_km(51.5074, -0.1278, 48.8566, 2.3522), 0)
        343.0  # London → Paris
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_KM * c


# ──────────────────────────────────────────────────────────────────────────────
#  Impossible-travel detection
# ──────────────────────────────────────────────────────────────────────────────
def detect_impossible_travel(
    prev_lat: float,
    prev_lon: float,
    prev_ts: datetime,
    curr_lat: float,
    curr_lon: float,
    curr_ts: datetime,
    max_speed_kmh: float = DEFAULT_MAX_SPEED_KMH,
) -> Optional[str]:
    """
    Return a reason string if the movement between two consecutive transactions
    implies an impossible travel speed, otherwise return None.

    Args:
        prev_lat, prev_lon: Previous transaction coordinates.
        prev_ts:            Previous transaction timestamp (timezone-aware).
        curr_lat, curr_lon: Current transaction coordinates.
        curr_ts:            Current transaction timestamp (timezone-aware).
        max_speed_kmh:      Maximum plausible travel speed (default 900 km/h).

    Returns:
        Reason string if impossible travel detected, else None.
    """
    # Ensure both timestamps are comparable (strip tz if needed)
    try:
        delta_sec = (curr_ts - prev_ts).total_seconds()
    except TypeError:
        # Fallback: strip tzinfo
        delta_sec = (
            curr_ts.replace(tzinfo=None) - prev_ts.replace(tzinfo=None)
        ).total_seconds()

    if delta_sec <= 0:
        # Same timestamp or out-of-order – treat as suspicious
        distance_km = haversine_km(prev_lat, prev_lon, curr_lat, curr_lon)
        if distance_km > 1.0:
            return (
                f"impossible_travel: {distance_km:.1f} km in {delta_sec:.0f}s "
                f"(zero/negative time delta)"
            )
        return None

    distance_km = haversine_km(prev_lat, prev_lon, curr_lat, curr_lon)
    elapsed_hours = delta_sec / 3600.0
    implied_speed_kmh = distance_km / elapsed_hours

    if implied_speed_kmh > max_speed_kmh:
        return (
            f"impossible_travel: {distance_km:.1f} km in {delta_sec:.0f}s "
            f"implies {implied_speed_kmh:.0f} km/h (max {max_speed_kmh:.0f} km/h)"
        )
    return None


# ──────────────────────────────────────────────────────────────────────────────
#  Velocity scoring
# ──────────────────────────────────────────────────────────────────────────────
def velocity_score(
    tx_count_5min: int,
    tx_amount_5min: float,
    avg_tx_amount: float,
) -> float:
    """
    Compute a velocity anomaly score in [0, 1].

    High score means the customer is transacting at an unusually high
    frequency or volume relative to their baseline.

    Args:
        tx_count_5min:  Number of transactions in the last 5 minutes.
        tx_amount_5min: Total amount spent in the last 5 minutes (USD).
        avg_tx_amount:  Customer's historical average transaction amount (USD).

    Returns:
        Score between 0.0 (normal) and 1.0 (maximum anomaly).
    """
    # Frequency component – sigmoid centred at 3 transactions / 5 min
    count_score = 1.0 / (1.0 + math.exp(-0.8 * (tx_count_5min - 3)))

    # Amount component – ratio of rolling spend vs. expected (capped at 10×)
    if avg_tx_amount > 0:
        amount_ratio = tx_amount_5min / (avg_tx_amount * max(tx_count_5min, 1))
        amount_score = min(1.0, amount_ratio / 10.0)
    else:
        amount_score = 0.5 if tx_amount_5min > 0 else 0.0

    # Weighted combination (frequency slightly more important)
    return round(0.55 * count_score + 0.45 * amount_score, 4)


# ──────────────────────────────────────────────────────────────────────────────
#  High-risk MCC scoring
# ──────────────────────────────────────────────────────────────────────────────
def mcc_risk_score(mcc: int, merchant_category: str) -> float:
    """Return a categorical risk score based on MCC code and merchant category."""
    if merchant_category in CRITICAL_CATEGORIES:
        return 0.75
    if mcc in HIGH_RISK_MCC:
        return 0.60
    return 0.0


# ──────────────────────────────────────────────────────────────────────────────
#  Composite fraud signal
# ──────────────────────────────────────────────────────────────────────────────
def compute_fraud_signal(
    transaction: Any,  # TransactionEvent or dict
    customer_history: list[dict[str, Any]],
) -> FraudSignal:
    """
    Combine all fraud signals into a final FraudSignal.

    Args:
        transaction:      A TransactionEvent (or compatible dict) for the
                          current transaction.
        customer_history: List of recent transaction dicts for this customer,
                          ordered oldest-first. Each dict must contain:
                          latitude, longitude, timestamp, amount.

    Returns:
        FraudSignal with composite score and human-readable reasons.
    """
    # Normalise input to dict
    if hasattr(transaction, "to_dict"):
        tx = transaction.to_dict()
    elif isinstance(transaction, dict):
        tx = transaction
    else:
        raise TypeError(f"Unsupported transaction type: {type(transaction)}")

    reasons: list[str] = []
    partial_scores: list[float] = []

    # ── 1. Impossible-travel check ────────────────────────────────────────────
    if customer_history:
        last = customer_history[-1]
        try:
            prev_ts = _parse_ts(last.get("timestamp", ""))
            curr_ts = _parse_ts(tx.get("timestamp", ""))

            travel_reason = detect_impossible_travel(
                prev_lat=float(last.get("latitude", 0)),
                prev_lon=float(last.get("longitude", 0)),
                prev_ts=prev_ts,
                curr_lat=float(tx.get("latitude", 0)),
                curr_lon=float(tx.get("longitude", 0)),
                curr_ts=curr_ts,
            )
            if travel_reason:
                reasons.append(travel_reason)
                partial_scores.append(0.90)
        except (ValueError, TypeError):
            pass  # Skip if timestamp parsing fails

    # ── 2. Velocity scoring ───────────────────────────────────────────────────
    from datetime import timezone as tz

    now_ts = _parse_ts(tx.get("timestamp", ""))
    window_sec = 5 * 60  # 5 minutes

    recent = [
        h for h in customer_history
        if abs((_parse_ts(h.get("timestamp", "")) - now_ts).total_seconds()) <= window_sec
    ]

    tx_count_5m = len(recent)
    tx_amount_5m = sum(float(h.get("amount", 0)) for h in recent)
    avg_amount = (
        sum(float(h.get("amount", 0)) for h in customer_history) / len(customer_history)
        if customer_history
        else float(tx.get("amount", 0))
    )

    vel_score = velocity_score(tx_count_5m, tx_amount_5m, avg_amount)
    partial_scores.append(vel_score * 0.7)  # Weight velocity slightly lower

    if vel_score > 0.70:
        reasons.append(
            f"high_velocity: {tx_count_5m} txns in 5min, "
            f"total ${tx_amount_5m:.2f} (avg ${avg_amount:.2f})"
        )

    # ── 3. High-risk MCC ──────────────────────────────────────────────────────
    mcc = int(tx.get("merchant_mcc", 0))
    category = tx.get("merchant_category", "")
    mcc_score = mcc_risk_score(mcc, category)
    if mcc_score > 0:
        partial_scores.append(mcc_score)
        reasons.append(f"high_risk_mcc: {category} (MCC {mcc})")

    # ── 4. Unknown device ─────────────────────────────────────────────────────
    device = tx.get("device_id", "")
    if device.startswith("UNKNOWN"):
        partial_scores.append(0.50)
        reasons.append(f"unknown_device: {device}")

    # ── 5. Composite score ────────────────────────────────────────────────────
    if partial_scores:
        # Use the max score with a dampening factor to avoid capping too easily
        composite = min(1.0, max(partial_scores) * 0.85 + sum(partial_scores) * 0.05)
    else:
        composite = 0.0

    composite = round(composite, 4)
    is_fraud = composite >= 0.65

    return FraudSignal(is_fraud=is_fraud, score=composite, reasons=reasons)


# ──────────────────────────────────────────────────────────────────────────────
#  Internal helpers
# ──────────────────────────────────────────────────────────────────────────────
def _parse_ts(ts_str: str) -> datetime:
    """Parse an ISO-8601 timestamp string into a datetime (UTC-aware)."""
    from datetime import timezone as _tz

    if not ts_str:
        return datetime.now(_tz.utc)

    # Handle Python's isoformat which may include +00:00
    ts_str = ts_str.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(ts_str)
    except ValueError:
        # Fallback – strip everything after the dot
        dt = datetime.strptime(ts_str[:19], "%Y-%m-%dT%H:%M:%S")

    if dt.tzinfo is None:
        from datetime import timezone as _tz2
        dt = dt.replace(tzinfo=_tz2.utc)
    return dt
