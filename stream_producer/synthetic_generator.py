"""
FinFlow Synthetic Transaction Stream Generator
Generates enterprise-grade, realistic financial transactions with:
  - Legitimate customer demographic dimensions
  - Realistic multi-currency FX conversions
  - Realistic merchant categories & MCC codes
  - Injected financial fraud archetypes (Velocity, Impossible Travel, Micro-Probing, High-Risk MCC)
"""

import math
import random
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Generator, List, Dict, Any
from stream_producer.schemas import TransactionEvent

# Currency Matrix (Base USD)
FX_RATES = {
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.28,
    "AED": 0.272,
    "SAR": 0.266,
    "EGP": 0.021
}

# Major Global Hubs with Lat / Lon
CITIES = [
    {"city": "New York", "country": "USA", "lat": 40.7128, "lon": -74.0060},
    {"city": "London", "country": "UK", "lat": 51.5074, "lon": -0.1278},
    {"city": "Cairo", "country": "Egypt", "lat": 30.0444, "lon": 31.2357},
    {"city": "Dubai", "country": "UAE", "lat": 25.2048, "lon": 55.2708},
    {"city": "Riyadh", "country": "Saudi Arabia", "lat": 24.7136, "lon": 46.6753},
    {"city": "Singapore", "country": "Singapore", "lat": 1.3521, "lon": 103.8198},
    {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503},
    {"city": "Frankfurt", "country": "Germany", "lat": 50.1109, "lon": 8.6821}
]

MERCHANTS = [
    {"name": "Whole Foods Market", "category": "Grocery", "mcc": 5411, "avg_amt": 85.0, "risk_level": "LOW"},
    {"name": "Apple Store Fifth Ave", "category": "Electronics", "mcc": 5732, "avg_amt": 850.0, "risk_level": "MEDIUM"},
    {"name": "Emirates Airlines", "category": "Travel", "mcc": 4511, "avg_amt": 1100.0, "risk_level": "MEDIUM"},
    {"name": "Binance Crypto Gateway", "category": "Cryptocurrency", "mcc": 6051, "avg_amt": 2200.0, "risk_level": "HIGH"},
    {"name": "Cartier Fine Jewelry", "category": "Luxury", "mcc": 5944, "avg_amt": 3400.0, "risk_level": "HIGH"},
    {"name": "Monte Carlo Casino Online", "category": "Gambling", "mcc": 7995, "avg_amt": 750.0, "risk_level": "CRITICAL"},
    {"name": "Shell Gas Station", "category": "Fuel", "mcc": 5541, "avg_amt": 45.0, "risk_level": "LOW"},
    {"name": "Uber Technologies", "category": "Rideshare", "mcc": 4121, "avg_amt": 22.0, "risk_level": "LOW"},
    {"name": "Amazon Web Store", "category": "E-Commerce", "mcc": 5311, "avg_amt": 120.0, "risk_level": "LOW"},
    {"name": "Starbucks Coffee", "category": "Food & Beverage", "mcc": 5814, "avg_amt": 9.5, "risk_level": "LOW"}
]

CARD_NETWORKS = ["Visa", "Mastercard", "Amex", "Discover"]
CARD_TYPES = ["Credit", "Debit", "Prepaid"]
CHANNELS = ["POS_Chip", "POS_Swipe", "Online_3DS", "Online_Card_Not_Present", "ATM_Withdrawal", "Mobile_Wallet"]
DEVICE_OS = ["iOS", "Android", "macOS", "Windows", "Linux"]
CUSTOMER_TIERS = ["Standard", "Standard", "Standard", "Premium", "VIP"]

class SyntheticTransactionGenerator:
    def __init__(self, num_customers: int = 300, seed: int = 42):
        random.seed(seed)
        self.customers = self._generate_customer_pool(num_customers)
        self.customer_history: Dict[str, List[Dict[str, Any]]] = {}

    def _generate_customer_pool(self, count: int) -> List[Dict[str, Any]]:
        pool = []
        for i in range(count):
            c_id = f"CUST-{1000 + i}"
            acc_id = f"ACC-{50000 + i}"
            home_city = random.choice(CITIES)
            network = random.choice(CARD_NETWORKS)
            tier = random.choice(CUSTOMER_TIERS)
            card_last4 = f"{random.randint(1000, 9999)}"
            card_masked = f"4{random.randint(100, 999)}-XXXX-XXXX-{card_last4}"
            pool.append({
                "customer_id": c_id,
                "account_id": acc_id,
                "tier": tier,
                "home_city": home_city,
                "card_network": network,
                "card_type": random.choice(CARD_TYPES),
                "card_masked": card_masked,
                "device_id": f"DEV-{uuid.uuid4().hex[:8].upper()}",
                "device_os": random.choice(DEVICE_OS)
            })
        return pool

    def generate_single_event(
        self,
        current_time: datetime = None,
        force_fraud_pattern: str = None
    ) -> TransactionEvent:
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        cust = random.choice(self.customers)
        cust_id = cust["customer_id"]

        # Fraud probability ~ 4.5% if not forced
        is_fraud = force_fraud_pattern is not None or (random.random() < 0.045)
        pattern = force_fraud_pattern if force_fraud_pattern else ("normal" if not is_fraud else random.choice([
            "velocity_surge",
            "impossible_travel",
            "micro_probing",
            "high_risk_mcc_spike"
        ]))

        # Normal defaults
        merchant = random.choice(MERCHANTS)
        city_info = cust["home_city"]
        amount = max(3.0, round(random.gauss(merchant["avg_amt"], merchant["avg_amt"] * 0.35), 2))
        currency = "USD"
        channel = random.choice(CHANNELS)
        device_id = cust["device_id"]
        device_os = cust["device_os"]

        # Apply Fraud Archetypes
        if pattern == "velocity_surge":
            # Very high amount and fast swipe
            amount = round(random.uniform(800.0, 3500.0), 2)
            channel = "Online_Card_Not_Present"
            merchant = next(m for m in MERCHANTS if m["category"] == "Electronics")

        elif pattern == "impossible_travel":
            # Transaction occurs in a distant city far from previous history
            remote_city = random.choice([c for c in CITIES if c["city"] != cust["home_city"]["city"]])
            city_info = remote_city
            amount = round(random.uniform(400.0, 1800.0), 2)
            channel = "ATM_Withdrawal"

        elif pattern == "micro_probing":
            # Very small probe
            if random.random() < 0.5:
                amount = round(random.uniform(1.0, 3.5), 2)
                pattern = "micro_probe_card_check"
            else:
                amount = round(random.uniform(2500.0, 5000.0), 2)
                pattern = "micro_probe_drain"
                merchant = next(m for m in MERCHANTS if m["category"] == "Luxury")

        elif pattern == "high_risk_mcc_spike":
            merchant = next(m for m in MERCHANTS if m["category"] in ["Cryptocurrency", "Gambling"])
            amount = round(random.uniform(1500.0, 4800.0), 2)
            channel = "Online_Card_Not_Present"
            device_id = f"UNKNOWN-DEV-{random.randint(1000, 9999)}"

        # Multi-currency variance
        if random.random() < 0.25:
            currency = random.choice(["EUR", "GBP", "AED", "SAR", "EGP"])
            rate = FX_RATES[currency]
            amount = round(amount / rate, 2)

        rate = FX_RATES.get(currency, 1.0)
        amount_usd = round(amount * rate, 2)

        # Micro-jitter in coordinates around city center (+- 0.05 deg)
        lat = round(city_info["lat"] + random.uniform(-0.04, 0.04), 5)
        lon = round(city_info["lon"] + random.uniform(-0.04, 0.04), 5)

        event = TransactionEvent(
            transaction_id=str(uuid.uuid4()),
            timestamp=current_time.isoformat(),
            account_id=cust["account_id"],
            customer_id=cust["customer_id"],
            customer_tier=cust["tier"],
            card_number_masked=cust["card_masked"],
            card_network=cust["card_network"],
            card_type=cust["card_type"],
            merchant_id=f"MCH-{abs(hash(merchant['name'])) % 10000:04d}",
            merchant_name=merchant["name"],
            merchant_category=merchant["category"],
            merchant_mcc=merchant["mcc"],
            amount=amount,
            currency=currency,
            amount_usd=amount_usd,
            channel=channel,
            terminal_id=f"TERM-{random.randint(100, 999)}",
            ip_address=f"{random.randint(11, 215)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}",
            city=city_info["city"],
            country=city_info["country"],
            latitude=lat,
            longitude=lon,
            device_id=device_id,
            device_os=device_os,
            is_fraud_synthetic=(pattern != "normal"),
            fraud_pattern=pattern
        )

        return event

    def generate_batch(self, count: int, start_time: datetime = None) -> List[TransactionEvent]:
        if start_time is None:
            start_time = datetime.now(timezone.utc) - timedelta(hours=2)

        events = []
        cur_t = start_time
        for _ in range(count):
            cur_t += timedelta(milliseconds=random.randint(50, 1500))
            events.append(self.generate_single_event(current_time=cur_t))
        return events

    def stream_live(self, interval_sec: float = 0.1) -> Generator[TransactionEvent, None, None]:
        while True:
            yield self.generate_single_event(current_time=datetime.now(timezone.utc))
            time.sleep(interval_sec)
