"""
Master Training Pipeline — Trains all 6 ML models on processed/synthetic data.
Run: python scripts/train_models.py
"""
import sys
import os
import time
from pathlib import Path

# Add project root to path
BASE_DIR = Path("d:/Razorpay project")
sys.path.insert(0, str(BASE_DIR / "backend"))

import pandas as pd
from rich.console import Console
from rich.table import Table

import sys
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
console = Console(legacy_windows=False)

PROCESSED_DIR = BASE_DIR / "data" / "processed"
SYNTHETIC_DIR = BASE_DIR / "data" / "synthetic"
MODELS_DIR = BASE_DIR / "models"


def train_credit_risk():
    console.print("\n[bold cyan]═══ Training Credit Risk Model (XGBoost) ═══[/bold cyan]")
    from app.ml.models.credit_risk_model import CreditRiskModel

    df = pd.read_csv(PROCESSED_DIR / "payments.csv")
    console.print(f"  Loaded {len(df)} payment records")

    model = CreditRiskModel()
    metrics = model.train(df, str(MODELS_DIR / "credit_risk.pkl"))
    return {"name": "Credit Risk", "type": "XGBoost", "records": len(df), **metrics}


def train_churn():
    console.print("\n[bold cyan]═══ Training Churn Model (LightGBM) ═══[/bold cyan]")
    from app.ml.models.churn_model import ChurnModel

    df = pd.read_csv(PROCESSED_DIR / "customers.csv")
    console.print(f"  Loaded {len(df)} customer records")

    model = ChurnModel()
    metrics = model.train(df, str(MODELS_DIR / "churn.pkl"))
    return {"name": "Churn", "type": "LightGBM", "records": len(df), **metrics}


def train_fraud():
    console.print("\n[bold cyan]═══ Training Fraud Model (IsolationForest + XGBoost) ═══[/bold cyan]")
    from app.ml.models.fraud_model import FraudModel

    df = pd.read_csv(PROCESSED_DIR / "transactions.csv")
    console.print(f"  Loaded {len(df)} transaction records")

    model = FraudModel()
    metrics = model.train(df, str(MODELS_DIR))
    return {"name": "Fraud", "type": "IsoForest+XGB", "records": len(df), **metrics}


def train_cyber():
    console.print("\n[bold cyan]═══ Training Cyber Model (RandomForest) ═══[/bold cyan]")
    from app.ml.models.cyber_model import CyberModel

    df = pd.read_csv(PROCESSED_DIR / "cyber_events.csv")
    console.print(f"  Loaded {len(df)} cyber events")

    model = CyberModel()
    metrics = model.train(df, str(MODELS_DIR / "cyber.pkl"))
    return {"name": "Cyber", "type": "RandomForest", "records": len(df), **metrics}


def train_operational():
    console.print("\n[bold cyan]═══ Training Operational Model (XGBoost) ═══[/bold cyan]")
    from app.ml.models.operational_model import OperationalModel

    ops_df = pd.read_csv(SYNTHETIC_DIR / "operations.csv")
    sup_df = pd.read_csv(SYNTHETIC_DIR / "suppliers.csv")
    console.print(f"  Loaded {len(ops_df)} operations + {len(sup_df)} suppliers")

    model = OperationalModel()
    metrics = model.train(ops_df, sup_df, str(MODELS_DIR / "operational.pkl"))
    return {"name": "Operational", "type": "XGBoost", "records": len(ops_df), **metrics}


def train_forecaster():
    console.print("\n[bold cyan]═══ Training Forecaster (StatsForecast) ═══[/bold cyan]")
    from app.ml.models.forecaster import Forecaster

    df = pd.read_csv(PROCESSED_DIR / "risk_events.csv")
    console.print(f"  Loaded {len(df)} risk events")

    model = Forecaster()
    metrics = model.train(df, str(MODELS_DIR / "forecaster.pkl"))
    return {"name": "Forecaster", "type": "AutoARIMA+ETS", "records": len(df), **metrics}


def main():
    console.print("[bold green]RiskSentinel — Model Training Pipeline[/bold green]")
    console.print(f"Models will be saved to: {MODELS_DIR}")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    results = []
    trainers = [
        train_credit_risk,
        train_churn,
        train_fraud,
        train_cyber,
        train_operational,
        train_forecaster,
    ]

    total_start = time.time()
    for trainer in trainers:
        try:
            start = time.time()
            result = trainer()
            result["time"] = f"{time.time() - start:.1f}s"
            result["status"] = "✅"
            results.append(result)
        except Exception as e:
            console.print(f"[red]  Error: {e}[/red]")
            import traceback
            traceback.print_exc()
            results.append({"name": trainer.__name__.replace("train_", ""), "status": "❌", "error": str(e)})

    total_time = time.time() - total_start

    # Print summary table
    console.print("\n")
    table = Table(title="🏆 Training Summary", show_header=True, header_style="bold magenta")
    table.add_column("Model", style="cyan")
    table.add_column("Type", style="green")
    table.add_column("Records", justify="right")
    table.add_column("AUC/MAE", justify="right")
    table.add_column("Time", justify="right")
    table.add_column("Status")

    for r in results:
        metric = ""
        if "auc" in r:
            metric = f"{r['auc']:.4f}"
        elif "mae" in r:
            metric = f"MAE: {r['mae']:.2f}"
        elif "n_observations" in r:
            metric = f"{r['n_observations']} obs"

        table.add_row(
            r.get("name", "?"),
            r.get("type", "?"),
            str(r.get("records", "?")),
            metric,
            r.get("time", "?"),
            r.get("status", "?"),
        )

    console.print(table)
    console.print(f"\n[bold green]Total training time: {total_time:.1f}s[/bold green]")

    # List saved models
    console.print("\n[bold]Saved model files:[/bold]")
    for f in sorted(MODELS_DIR.glob("*.pkl")):
        size_mb = f.stat().st_size / (1024 * 1024)
        console.print(f"  📦 {f.name} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
