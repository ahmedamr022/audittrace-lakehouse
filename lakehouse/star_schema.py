"""
AuditTrace Gold Layer: Star Schema Materialization
Builds dimensional models (Fact & Dimension tables) and aggregated business marts in DuckDB.
"""

from pathlib import Path
from typing import Optional
import duckdb
from config.logging_config import get_logger
from config.settings import settings

logger = get_logger(__name__)


class StarSchemaBuilder:
    """Constructs and refreshes the Gold Star Schema from Silver tables in DuckDB."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = str(db_path or settings.duckdb_path)

    def build_marts(self) -> dict[str, int]:
        """
        Executes dimensional transformations:
        1. dim_customers
        2. dim_merchants
        3. dim_locations
        4. dim_dates
        5. fact_transactions
        6. agg_daily_fraud_summary
        """
        con = duckdb.connect(self.db_path)
        counts = {}

        try:
            # Verify silver_transactions exists
            table_check = con.execute("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'silver_transactions'
            """).fetchone()[0]

            if table_check == 0:
                logger.warning("silver_transactions table not found. Cannot build Gold marts.")
                return counts

            logger.info("Building Gold Star Schema dimensions...")

            # 1. Dimension: Customers
            con.execute("""
                CREATE OR REPLACE TABLE dim_customers AS
                SELECT
                    ROW_NUMBER() OVER (ORDER BY customer_id) AS customer_key,
                    customer_id,
                    customer_tier,
                    FIRST(city) AS home_city,
                    FIRST(country) AS home_country,
                    MIN(timestamp) AS first_seen_ts,
                    MAX(timestamp) AS last_seen_ts
                FROM silver_transactions
                GROUP BY customer_id, customer_tier
            """)
            counts["dim_customers"] = con.execute("SELECT COUNT(*) FROM dim_customers").fetchone()[0]

            # 2. Dimension: Merchants
            con.execute("""
                CREATE OR REPLACE TABLE dim_merchants AS
                SELECT
                    ROW_NUMBER() OVER (ORDER BY merchant_id) AS merchant_key,
                    merchant_id,
                    merchant_name,
                    merchant_category,
                    merchant_mcc,
                    CASE 
                        WHEN merchant_category IN ('Cryptocurrency', 'Gambling') THEN 'CRITICAL'
                        WHEN merchant_category IN ('Luxury', 'Travel') THEN 'HIGH'
                        WHEN merchant_category = 'Electronics' THEN 'MEDIUM'
                        ELSE 'LOW'
                    END AS risk_tier
                FROM silver_transactions
                GROUP BY merchant_id, merchant_name, merchant_category, merchant_mcc
            """)
            counts["dim_merchants"] = con.execute("SELECT COUNT(*) FROM dim_merchants").fetchone()[0]

            # 3. Dimension: Locations
            con.execute("""
                CREATE OR REPLACE TABLE dim_locations AS
                SELECT
                    ROW_NUMBER() OVER (ORDER BY city, country) AS location_key,
                    city,
                    country,
                    ROUND(AVG(latitude), 4) AS latitude,
                    ROUND(AVG(longitude), 4) AS longitude
                FROM silver_transactions
                GROUP BY city, country
            """)
            counts["dim_locations"] = con.execute("SELECT COUNT(*) FROM dim_locations").fetchone()[0]

            # 4. Dimension: Dates
            con.execute("""
                CREATE OR REPLACE TABLE dim_dates AS
                WITH distinct_dates AS (
                    SELECT DISTINCT CAST(SUBSTRING(timestamp, 1, 10) AS DATE) AS full_date
                    FROM silver_transactions
                )
                SELECT
                    CAST(STRFTIME(full_date, '%Y%m%d') AS INTEGER) AS date_key,
                    full_date,
                    EXTRACT(YEAR FROM full_date) AS year,
                    EXTRACT(MONTH FROM full_date) AS month,
                    EXTRACT(DAY FROM full_date) AS day_of_month,
                    STRFTIME(full_date, '%A') AS day_name,
                    EXTRACT(DOW FROM full_date) AS day_of_week,
                    CASE WHEN EXTRACT(DOW FROM full_date) IN (0, 6) THEN TRUE ELSE FALSE END AS is_weekend
                FROM distinct_dates
            """)
            counts["dim_dates"] = con.execute("SELECT COUNT(*) FROM dim_dates").fetchone()[0]

            # 5. Fact Table: Transactions
            con.execute("""
                CREATE OR REPLACE TABLE fact_transactions AS
                SELECT
                    s.transaction_id,
                    d.date_key,
                    c.customer_key,
                    m.merchant_key,
                    l.location_key,
                    s.timestamp AS transaction_timestamp,
                    s.channel,
                    s.card_network,
                    s.card_type,
                    s.amount AS amount_local,
                    s.currency,
                    s.amount_usd,
                    s.risk_score,
                    s.fraud_predicted AS is_fraud,
                    s.anomaly_reason AS fraud_reason,
                    s.processing_latency_ms
                FROM silver_transactions s
                LEFT JOIN dim_dates d 
                    ON d.full_date = CAST(SUBSTRING(s.timestamp, 1, 10) AS DATE)
                LEFT JOIN dim_customers c 
                    ON c.customer_id = s.customer_id
                LEFT JOIN dim_merchants m 
                    ON m.merchant_id = s.merchant_id
                LEFT JOIN dim_locations l 
                    ON l.city = s.city AND l.country = s.country
            """)
            counts["fact_transactions"] = con.execute("SELECT COUNT(*) FROM fact_transactions").fetchone()[0]

            # 6. Aggregated Business Mart: Daily Fraud Summary
            con.execute("""
                CREATE OR REPLACE TABLE agg_daily_fraud_summary AS
                SELECT
                    d.full_date AS summary_date,
                    COUNT(*) AS total_transactions,
                    ROUND(SUM(amount_usd), 2) AS total_volume_usd,
                    ROUND(AVG(amount_usd), 2) AS avg_transaction_usd,
                    COUNT(CASE WHEN is_fraud THEN 1 END) AS fraud_count,
                    ROUND(COALESCE(SUM(CASE WHEN is_fraud THEN amount_usd ELSE 0 END), 0), 2) AS fraud_volume_usd,
                    ROUND(100.0 * COUNT(CASE WHEN is_fraud THEN 1 END) / NULLIF(COUNT(*), 0), 2) AS fraud_rate_pct,
                    COUNT(CASE WHEN fraud_reason LIKE '%velocity%' THEN 1 END) AS velocity_alerts,
                    COUNT(CASE WHEN fraud_reason LIKE '%impossible%' THEN 1 END) AS impossible_travel_alerts
                FROM fact_transactions f
                JOIN dim_dates d ON d.date_key = f.date_key
                GROUP BY d.full_date
                ORDER BY d.full_date DESC
            """)
            counts["agg_daily_fraud_summary"] = con.execute("SELECT COUNT(*) FROM agg_daily_fraud_summary").fetchone()[0]

            logger.info("Gold Star Schema created successfully", extra=counts)
            return counts

        finally:
            con.close()
