"""
Unit Tests: Fraud Detection & Geospatial Logic
Tests Haversine distance, speed detection, and velocity scoring.
"""

from datetime import datetime, timezone, timedelta
import pytest
from stream_processor.fraud_detector import (
    haversine_km,
    detect_impossible_travel,
    velocity_score,
    compute_fraud_signal,
)


def test_haversine_distance():
    # London (51.5074, -0.1278) to Paris (48.8566, 2.3522) = ~343 km
    dist = haversine_km(51.5074, -0.1278, 48.8566, 2.3522)
    assert 340.0 < dist < 346.0

    # Same location must be 0 km
    assert haversine_km(40.7128, -74.0060, 40.7128, -74.0060) == 0.0


def test_impossible_travel_detected():
    # Cairo to London (~3,500 km) in 10 minutes (Speed ~ 21,000 km/h) -> Impossible
    t1 = datetime(2026, 10, 1, 10, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 10, 1, 10, 10, 0, tzinfo=timezone.utc)

    cairo_lat, cairo_lon = 30.0444, 31.2357
    london_lat, london_lon = 51.5074, -0.1278

    anomaly = detect_impossible_travel(
        prev_lat=cairo_lat,
        prev_lon=cairo_lon,
        prev_ts=t1,
        curr_lat=london_lat,
        curr_lon=london_lon,
        curr_ts=t2,
        max_speed_kmh=900.0,
    )
    assert anomaly is not None
    assert "impossible_travel" in anomaly.lower() or "speed" in anomaly.lower()


def test_realistic_travel_allowed():
    # London to Paris (343 km) in 4 hours (Speed ~ 85 km/h) -> Realistic
    t1 = datetime(2026, 10, 1, 10, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 10, 1, 14, 0, 0, tzinfo=timezone.utc)

    london_lat, london_lon = 51.5074, -0.1278
    paris_lat, paris_lon = 48.8566, 2.3522

    anomaly = detect_impossible_travel(
        prev_lat=london_lat,
        prev_lon=london_lon,
        prev_ts=t1,
        curr_lat=paris_lat,
        curr_lon=paris_lon,
        curr_ts=t2,
        max_speed_kmh=900.0,
    )
    assert anomaly is None


def test_velocity_score_scaling():
    # Single normal transaction
    low_score = velocity_score(tx_count_5min=1, tx_amount_5min=50.0, avg_tx_amount=50.0)
    assert low_score < 0.30

    # 6 rapid transactions in 5 minutes with 5x typical spend
    high_score = velocity_score(tx_count_5min=6, tx_amount_5min=2500.0, avg_tx_amount=100.0)
    assert high_score > 0.65
