"""
FinFlow Customer & Merchant Enricher
Adds contextual information to raw transactions before writing to Silver layer.
"""

from __future__ import annotations

import statistics
from collections import defaultdict
from typing import Any

from config.logging_config import get_logger

logger = get_logger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
#  In-memory enrichment stores (replace with Redis / DB lookup in production)
# ──────────────────────────────────────────────────────────────────────────────

# tier → credit-limit multiplier for risk assessment
TIER_LIMITS: dict[str, float] = {
    "Standard": 5_000.0,
    "Premium": 20_000.0,
    "VIP": 100_000.0,
}

# MCC → canonical merchant category name
MCC_CATEGORY_MAP: dict[int, str] = {
    5411: "Grocery",
    5732: "Electronics",
    4511: "Travel",
    6051: "Cryptocurrency",
    5944: "Luxury",
    7995: "Gambling",
    5541: "Fuel",
    4121: "Rideshare",
    5311: "E-Commerce",
    5814: "Food & Beverage",
}


class CustomerEnricher:
    """
    Maintains a lightweight in-memory customer profile derived from
    observed transaction history.
    """

    def __init__(self) -> None:
        # customer_id → list of transaction amounts seen
        self._amount_history: dict[str, list[float]] = defaultdict(list)
        # customer_id → tier (populated on first encounter)
        self._tier_map: dict[str, str] = {}

    def update(self, tx: dict[str, Any]) -> None:
        """Record a transaction in the customer profile."""
        cid = tx.get("customer_id", "")
        if not cid:
            return
        self._amount_history[cid].append(float(tx.get("amount", 0.0)))
        if cid not in self._tier_map:
            self._tier_map[cid] = tx.get("customer_tier", "Standard")

    def enrich(self, tx: dict[str, Any]) -> dict[str, Any]:
        """
        Return enrichment fields for a transaction.

        Returns a dict with:
            avg_customer_amount: Historical mean transaction amount
            stddev_customer_amount: Standard deviation of amounts
            credit_limit: Tier-based credit ceiling
            is_over_credit_limit: Whether this transaction exceeds the limit
        """
        cid = tx.get("customer_id", "")
        amounts = self._amount_history.get(cid, [])
        tier = self._tier_map.get(cid, tx.get("customer_tier", "Standard"))
        credit_limit = TIER_LIMITS.get(tier, 5_000.0)

        if amounts:
            avg = statistics.mean(amounts)
            std = statistics.stdev(amounts) if len(amounts) > 1 else 0.0
        else:
            avg = float(tx.get("amount", 0.0))
            std = 0.0

        return {
            "avg_customer_amount": round(avg, 4),
            "stddev_customer_amount": round(std, 4),
            "credit_limit": credit_limit,
            "is_over_credit_limit": float(tx.get("amount_usd", 0.0)) > credit_limit,
        }

    def avg_amount(self, customer_id: str) -> float:
        amounts = self._amount_history.get(customer_id, [])
        return statistics.mean(amounts) if amounts else 0.0


class MerchantEnricher:
    """Enriches transactions with canonical merchant metadata."""

    def enrich(self, tx: dict[str, Any]) -> dict[str, Any]:
        """Return canonical merchant category from MCC code."""
        mcc = int(tx.get("merchant_mcc", 0))
        canonical_category = MCC_CATEGORY_MAP.get(mcc, tx.get("merchant_category", "Other"))
        is_high_risk = mcc in {6051, 7995, 5944, 6011, 6010, 4829}

        return {
            "canonical_merchant_category": canonical_category,
            "is_high_risk_merchant": is_high_risk,
        }


class FinFlowEnricher:
    """Composite enricher combining customer and merchant enrichment."""

    def __init__(self) -> None:
        self.customer = CustomerEnricher()
        self.merchant = MerchantEnricher()

    def enrich_transaction(self, tx: dict[str, Any]) -> dict[str, Any]:
        """
        Enrich a raw transaction dict with customer and merchant context.

        Updates internal customer history and returns a merged dict.
        """
        customer_fields = self.customer.enrich(tx)
        merchant_fields = self.merchant.enrich(tx)

        # Update history AFTER enrichment to avoid contaminating current score
        self.customer.update(tx)

        return {**tx, **customer_fields, **merchant_fields}

    def enrich_batch(self, transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Enrich a list of transactions in order."""
        return [self.enrich_transaction(tx) for tx in transactions]
