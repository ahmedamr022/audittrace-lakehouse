"""
AuditTrace: Financial Transaction Intelligence & Risk Surveillance Dashboard
Streamlit local interface for operations, fraud surveillance, and Lakehouse SQL querying.
"""

import json
from pathlib import Path
import duckdb
import pandas as pd
import streamlit as st

# Configure page
st.set_page_config(
    page_title="AuditTrace | Financial Risk & Lakehouse Operations",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

DB_PATH = Path("data/lakehouse/silver/audittrace.duckdb")
DLQ_PATH = Path("data/lakehouse/dlq/invalid_records.jsonl")


def get_duckdb_conn():
    if not DB_PATH.exists():
        return None
    return duckdb.connect(str(DB_PATH), read_only=True)


# Sidebar
st.sidebar.title("🛡️ AuditTrace")
st.sidebar.caption("Financial Lakehouse & Risk Surveillance Engine")
st.sidebar.markdown("---")

# Refresh / Pipeline Execution in Sidebar
st.sidebar.subheader("Pipeline Controls")
num_events_to_run = st.sidebar.slider("Batch Size to Process", min_value=500, max_value=10000, value=2500, step=500)
if st.sidebar.button("▶️ Run Ingestion Batch", use_container_width=True):
    with st.spinner(f"Ingesting & processing {num_events_to_run:,} events..."):
        from run_pipeline import run_pipeline
        metrics = run_pipeline(num_events=num_events_to_run, inject_corrupt=True)
        st.sidebar.success(f"Processed {metrics['valid_events']:,} events in {metrics['elapsed_seconds']:.2f}s!")
        st.rerun()

st.sidebar.markdown("---")
st.sidebar.info("""
**Architecture Layers:**
- **Bronze**: Raw Parquet (Append-only)
- **Silver**: DuckDB (Cleaned + Scored)
- **Gold**: Star Schema (Fact + Dimensions)
- **DLQ**: Quarantined Invalid Payloads
""")

# Title Header
st.title("Financial Risk Surveillance & Lakehouse Operations")
st.markdown("Real-time fraud scoring, data quality gates, and Medallion analytical storage.")

con = get_duckdb_conn()

if con is None:
    st.warning("⚠️ Lakehouse database not detected yet. Click **'Run Ingestion Batch'** in the sidebar to generate and process your first batch of transactions!")
    st.stop()

# Query High-Level Summary Metrics
try:
    stats = con.execute("""
        SELECT 
            COUNT(*) AS total_tx,
            COALESCE(SUM(amount_usd), 0) AS total_vol,
            COALESCE(AVG(amount_usd), 0) AS avg_ticket,
            COUNT(CASE WHEN fraud_predicted THEN 1 END) AS fraud_count,
            COALESCE(AVG(risk_score), 0) AS avg_risk
        FROM silver_transactions
    """).fetchone()

    total_tx = stats[0]
    total_vol = stats[1]
    avg_ticket = stats[2]
    fraud_count = stats[3]
    avg_risk = stats[4]
    fraud_rate = (fraud_count / total_tx * 100) if total_tx > 0 else 0.0

except Exception as e:
    st.error(f"Error querying Silver Layer: {e}")
    st.stop()

# Count DLQ records
dlq_count = 0
if DLQ_PATH.exists():
    with open(DLQ_PATH, "r", encoding="utf-8") as f:
        dlq_count = sum(1 for line in f if line.strip())

# Top KPI Metric Cards
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Processed Transactions", f"{total_tx:,}")
c2.metric("Total Volume ($)", f"${total_vol:,.2f}")
c3.metric("Avg Ticket Size", f"${avg_ticket:,.2f}")
c4.metric("Flagged Fraud Rate", f"{fraud_rate:.2f}%", f"{fraud_count:,} alerts", delta_color="inverse")
c5.metric("Quarantined in DLQ", f"{dlq_count:,} records")

st.markdown("---")

# Navigation Tabs
tab_fraud, tab_lakehouse, tab_dlq, tab_star_schema = st.tabs([
    "🚨 Fraud & Risk Surveillance",
    "🏛️ Lakehouse SQL Explorer",
    "🛡️ Dead-Letter Queue (DLQ)",
    "⭐ Star Schema Dimensions",
])

with tab_fraud:
    st.subheader("Live Flagged Transactions & Suspicious Velocity")
    
    col_filter1, col_filter2 = st.columns([1, 3])
    with col_filter1:
        min_risk = st.slider("Minimum Risk Score Filter", 0.0, 1.0, 0.50, 0.05)
    
    flagged_df = con.execute(f"""
        SELECT 
            transaction_id,
            timestamp,
            customer_id,
            merchant_name,
            merchant_category,
            amount_usd,
            channel,
            city,
            country,
            ROUND(risk_score, 3) AS risk_score,
            anomaly_reason
        FROM silver_transactions
        WHERE risk_score >= {min_risk}
        ORDER BY timestamp DESC
        LIMIT 100
    """).df()

    st.dataframe(flagged_df, use_container_width=True)

    col_chart1, col_chart2 = st.columns(2)
    with col_chart1:
        st.subheader("Anomalies by Merchant Category")
        cat_df = con.execute("""
            SELECT merchant_category, COUNT(*) AS count
            FROM silver_transactions
            WHERE fraud_predicted = true
            GROUP BY merchant_category
            ORDER BY count DESC
        """).df()
        st.bar_chart(cat_df.set_index("merchant_category"))

    with col_chart2:
        st.subheader("Distribution of Risk Scores")
        risk_dist = con.execute("""
            SELECT 
                CASE 
                    WHEN risk_score < 0.2 THEN '0.0 - 0.2 (Safe)'
                    WHEN risk_score < 0.5 THEN '0.2 - 0.5 (Low)'
                    WHEN risk_score < 0.75 THEN '0.5 - 0.75 (Suspicious)'
                    ELSE '0.75 - 1.0 (Critical)'
                END AS risk_tier,
                COUNT(*) AS count
            FROM silver_transactions
            GROUP BY risk_tier
            ORDER BY risk_tier
        """).df()
        st.bar_chart(risk_dist.set_index("risk_tier"))

with tab_lakehouse:
    st.subheader("Interactive Lakehouse SQL Query Runner")
    st.caption("Execute analytical SQL queries directly on your DuckDB database.")

    default_query = "SELECT * FROM fact_transactions LIMIT 20;"
    user_query = st.text_area("SQL Query", value=default_query, height=100)

    if st.button("Execute SQL"):
        try:
            res_df = con.execute(user_query).df()
            st.success(f"Returned {len(res_df):,} rows")
            st.dataframe(res_df, use_container_width=True)
        except Exception as err:
            st.error(f"SQL Error: {err}")

with tab_dlq:
    st.subheader("Dead-Letter Queue (DLQ) Quarantine Inspector")
    st.caption("Transactions that failed validation contracts (e.g. negative amounts, corrupt coordinates).")

    if not DLQ_PATH.exists() or dlq_count == 0:
        st.info("No records in DLQ. All ingested records passed data quality gates.")
    else:
        dlq_records = []
        with open(DLQ_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        dlq_records.append(json.loads(line))
                    except Exception:
                        pass
        
        parsed_rows = []
        for r in dlq_records[-50:]:
            raw = r.get("raw_payload", {})
            parsed_rows.append({
                "Rejected At": r.get("rejected_at"),
                "Rejection Reasons": ", ".join(r.get("rejection_reasons", [])),
                "Transaction ID": raw.get("transaction_id"),
                "Amount": raw.get("amount"),
                "Currency": raw.get("currency"),
                "Latitude": raw.get("latitude"),
                "Longitude": raw.get("longitude"),
            })
        
        st.dataframe(pd.DataFrame(parsed_rows), use_container_width=True)

with tab_star_schema:
    st.subheader("Gold Layer Star Schema Dimensions")
    dim_choice = st.selectbox("Select Dimension Table to Inspect", [
        "dim_customers",
        "dim_merchants",
        "dim_locations",
        "dim_dates",
        "agg_daily_fraud_summary"
    ])

    try:
        dim_data = con.execute(f"SELECT * FROM {dim_choice} LIMIT 100").df()
        st.dataframe(dim_data, use_container_width=True)
    except Exception as err:
        st.error(f"Error loading {dim_choice}: {err}")
