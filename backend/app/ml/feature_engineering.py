"""
Feature Engineering — Transform raw entity data into model-ready features.
Each function maps raw CSVs/dicts to the feature schema expected by the corresponding model.
"""
import pandas as pd
import numpy as np
from typing import Dict


def engineer_credit_features(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features for the credit risk model from payments data."""
    df = raw_df.copy()
    df["bill_amount"] = pd.to_numeric(df.get("bill_amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["payment_amount"] = pd.to_numeric(df.get("payment_amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["payment_delay_days"] = pd.to_numeric(df.get("payment_delay_days", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["credit_limit"] = pd.to_numeric(df.get("credit_limit", pd.Series(dtype=float)), errors="coerce").fillna(5000)
    df["balance"] = pd.to_numeric(df.get("balance", pd.Series(dtype=float)), errors="coerce").fillna(0)

    # Derived features
    df["utilization_ratio"] = (df["balance"] / df["credit_limit"].replace(0, 1)).clip(0, 1)
    df["payment_ratio"] = (df["payment_amount"] / df["bill_amount"].replace(0, 1)).clip(0, 5)
    df["is_late"] = (df["payment_delay_days"] > 0).astype(int)
    df["debt_to_income"] = (df["balance"] / df["credit_limit"].replace(0, 1)).clip(0, 2)
    df["payment_regularity"] = (df["payment_amount"] > 0).astype(int)

    return df


def engineer_churn_features(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features for the churn model from customer data."""
    df = raw_df.copy()
    df["tenure_months"] = pd.to_numeric(df.get("tenure_months", pd.Series(dtype=float)), errors="coerce").fillna(12)
    df["monthly_charges"] = pd.to_numeric(df.get("monthly_charges", pd.Series(dtype=float)), errors="coerce").fillna(50)
    df["total_charges"] = pd.to_numeric(df.get("total_charges", pd.Series(dtype=float)), errors="coerce").fillna(600)
    df["credit_utilization"] = pd.to_numeric(df.get("credit_utilization", pd.Series(dtype=float)), errors="coerce").fillna(0.4)

    # Derived features
    df["charge_ratio"] = (df["monthly_charges"] / df["total_charges"].replace(0, 1)).clip(0, 1)
    df["tenure_bucket"] = pd.cut(
        df["tenure_months"], bins=[0, 6, 12, 24, 48, 72, 999], labels=[0, 1, 2, 3, 4, 5]
    ).astype(int)
    df["engagement_score"] = (
        (df["tenure_months"] / 72) * 0.4 +
        (1 - df["charge_ratio"]) * 0.3 +
        (1 - df["credit_utilization"]) * 0.3
    ).clip(0, 1)

    return df


def engineer_fraud_features(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features for the fraud model from transaction data."""
    df = raw_df.copy()
    df["amount"] = pd.to_numeric(df.get("amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["velocity_1h"] = pd.to_numeric(df.get("velocity_1h", pd.Series(dtype=float)), errors="coerce").fillna(1)
    df["velocity_24h"] = pd.to_numeric(df.get("velocity_24h", pd.Series(dtype=float)), errors="coerce").fillna(1)
    df["distance_from_home"] = pd.to_numeric(df.get("distance_from_home", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["is_online"] = df.get("is_online", pd.Series(False)).astype(int)

    # Derived features
    mean_amt = df["amount"].mean() or 100
    std_amt = df["amount"].std() or 50
    df["amount_zscore"] = ((df["amount"] - mean_amt) / max(std_amt, 1)).clip(-5, 5)
    df["velocity_ratio"] = (df["velocity_1h"] / df["velocity_24h"].replace(0, 1)).clip(0, 1)

    if "timestamp" in df.columns:
        try:
            df["hour_of_day"] = pd.to_datetime(df["timestamp"]).dt.hour
        except Exception:
            df["hour_of_day"] = 12
    else:
        df["hour_of_day"] = 12

    return df


def engineer_cyber_features(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features for the cyber model from network event data."""
    df = raw_df.copy()
    df["duration"] = pd.to_numeric(df.get("duration", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["src_bytes"] = pd.to_numeric(df.get("src_bytes", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["dst_bytes"] = pd.to_numeric(df.get("dst_bytes", pd.Series(dtype=float)), errors="coerce").fillna(0)

    # Derived features
    df["traffic_ratio"] = (df["src_bytes"] / df["dst_bytes"].replace(0, 1)).clip(0, 100)
    df["bytes_total"] = df["src_bytes"] + df["dst_bytes"]
    df["port_scan_indicator"] = ((df["duration"] < 0.01) & (df["src_bytes"] > 100)).astype(int)

    return df


def engineer_operational_features(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features for the operational model from supply chain data."""
    df = raw_df.copy()
    df["reliability_score"] = pd.to_numeric(df.get("reliability_score", pd.Series(dtype=float)), errors="coerce").fillna(0.8)
    df["avg_delivery_days"] = pd.to_numeric(df.get("avg_delivery_days", pd.Series(dtype=float)), errors="coerce").fillna(7)
    df["order_value"] = pd.to_numeric(df.get("order_value", pd.Series(dtype=float)), errors="coerce").fillna(50000)
    df["production_capacity_pct"] = pd.to_numeric(df.get("production_capacity_pct", pd.Series(dtype=float)), errors="coerce").fillna(95)
    df["quality_score"] = pd.to_numeric(df.get("quality_score", pd.Series(dtype=float)), errors="coerce").fillna(90)

    # Derived features
    df["delay_trend"] = df["reliability_score"].rolling(window=5, min_periods=1).mean()
    df["reliability_decay"] = (1 - df["reliability_score"]).clip(0, 1)

    return df


def entity_features_from_data(entity_id: str, entity_type: str, data_dir: str = "d:/Razorpay project/data") -> Dict:
    """Load and aggregate features for a specific entity from processed data files.

    Returns a dict with keys for each risk domain.
    """
    from pathlib import Path
    data_path = Path(data_dir)
    result = {}

    try:
        # Financial / Credit features
        payments_path = data_path / "processed" / "payments.csv"
        if payments_path.exists():
            payments = pd.read_csv(payments_path)
            entity_payments = payments[payments["customer_id"] == entity_id]
            if len(entity_payments) > 0:
                latest = entity_payments.iloc[-1]
                result["credit"] = {
                    "bill_amount": float(latest.get("bill_amount", 0)),
                    "payment_amount": float(latest.get("payment_amount", 0)),
                    "payment_delay_days": float(latest.get("payment_delay_days", 0)),
                    "credit_limit": float(latest.get("credit_limit", 5000)),
                    "balance": float(latest.get("balance", 0)),
                }

        # Customer / Churn features
        customers_path = data_path / "processed" / "customers.csv"
        if customers_path.exists():
            customers = pd.read_csv(customers_path)
            entity_cust = customers[customers["customer_id"] == entity_id]
            if len(entity_cust) > 0:
                cust = entity_cust.iloc[0]
                result["customer"] = {
                    "tenure_months": int(cust.get("tenure_months", 12)),
                    "monthly_charges": float(cust.get("monthly_charges", 50)),
                    "total_charges": float(cust.get("total_charges", 600)),
                    "credit_utilization": float(cust.get("credit_utilization", 0.4)),
                    "age": int(cust.get("age", 35)),
                    "contract_type": str(cust.get("contract_type", "Month-to-month")),
                    "payment_method": str(cust.get("payment_method", "Electronic check")),
                    "internet_service": str(cust.get("internet_service", "Fiber optic")),
                    "segment": str(cust.get("segment", "retail")),
                }

        # Transaction / Fraud features
        txn_path = data_path / "processed" / "transactions.csv"
        if txn_path.exists():
            txns = pd.read_csv(txn_path)
            entity_txns = txns[txns["customer_id"] == entity_id]
            if len(entity_txns) > 0:
                latest_txn = entity_txns.iloc[-1]
                result["fraud"] = {
                    "amount": float(latest_txn.get("amount", 0)),
                    "velocity_1h": int(latest_txn.get("velocity_1h", 1)),
                    "velocity_24h": int(latest_txn.get("velocity_24h", 1)),
                    "distance_from_home": float(latest_txn.get("distance_from_home", 0)),
                    "is_online": bool(latest_txn.get("is_online", False)),
                }
                # Aggregate stats
                result["fraud"]["avg_amount"] = float(entity_txns["amount"].mean())
                result["fraud"]["txn_count"] = len(entity_txns)

        # Supplier / Operational features
        if entity_type == "supplier":
            suppliers_path = data_path / "synthetic" / "suppliers.csv"
            if suppliers_path.exists():
                suppliers = pd.read_csv(suppliers_path)
                entity_sup = suppliers[suppliers["supplier_id"] == entity_id]
                if len(entity_sup) > 0:
                    sup = entity_sup.iloc[0]
                    result["operational"] = {
                        "reliability_score": float(sup.get("reliability_score", 0.8)),
                        "avg_delivery_days": int(sup.get("avg_delivery_days", 7)),
                        "category": str(sup.get("category", "components")),
                        "criticality": str(sup.get("criticality", "medium")),
                        "contract_value": int(sup.get("contract_value", 500000)),
                    }

            ops_path = data_path / "synthetic" / "operations.csv"
            if ops_path.exists():
                ops = pd.read_csv(ops_path)
                entity_ops = ops[ops["supplier_id"] == entity_id]
                if len(entity_ops) > 0:
                    latest_op = entity_ops.iloc[-1]
                    if "operational" not in result:
                        result["operational"] = {}
                    result["operational"].update({
                        "order_value": int(latest_op.get("order_value", 50000)),
                        "production_capacity_pct": int(latest_op.get("production_capacity_pct", 95)),
                        "quality_score": int(latest_op.get("quality_score", 90)),
                        "delay_days": int(latest_op.get("delay_days", 0)),
                    })

        # Cyber features (entity_type = system)
        cyber_path = data_path / "processed" / "cyber_events.csv"
        if cyber_path.exists():
            cyber = pd.read_csv(cyber_path)
            # Sample recent cyber events (not entity-specific for cyber)
            recent = cyber.tail(100)
            attack_rate = recent["is_attack"].mean() if "is_attack" in recent.columns else 0.05
            result["cyber"] = {
                "attack_rate": float(attack_rate),
                "avg_src_bytes": float(recent["src_bytes"].mean()) if "src_bytes" in recent.columns else 1000,
                "avg_duration": float(recent["duration"].mean()) if "duration" in recent.columns else 1.0,
                "protocol": "tcp",
                "service": "http",
            }

    except Exception as e:
        print(f"Feature loading error for {entity_id}: {e}")

    return result
