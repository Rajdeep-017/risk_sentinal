"""
Fraud Model Threshold Tuning
Sweeps decision thresholds against a held-out split, reports precision/recall/F1/F2
at each, and recommends an operating point based on cost-weighted trade-offs.

Run: python scripts/tune_fraud_threshold.py
"""
import sys
from pathlib import Path

BASE_DIR = Path("d:/Razorpay project")
sys.path.insert(0, str(BASE_DIR / "backend"))

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score, recall_score, f1_score, fbeta_score,
    precision_recall_curve, auc,
)

from app.ml.models.fraud_model import FraudModel

PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"
OUT_DIR = BASE_DIR / "reports"


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Load model + data ──────────────────────────────────────────────
    model = FraudModel()
    model.load(str(MODELS_DIR / "fraud_iso.pkl"), str(MODELS_DIR / "fraud_xgb.pkl"))

    df = pd.read_csv(PROCESSED_DIR / "transactions.csv")
    features_df = model._engineer_features(df)
    X = features_df[model.feature_names].values
    y = df["is_fraud"].values[:len(X)]

    # Recreate the SAME held-out split used at training time (same random_state)
    # so these numbers reflect genuine test performance, not train-set overfitting.
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    proba = model.xgb.predict_proba(X_test)[:, 1]

    # ── Threshold sweep ─────────────────────────────────────────────────
    thresholds = np.arange(0.05, 0.55, 0.05)
    rows = []
    for t in thresholds:
        preds = (proba >= t).astype(int)
        p = precision_score(y_test, preds, zero_division=0)
        r = recall_score(y_test, preds, zero_division=0)
        f1 = f1_score(y_test, preds, zero_division=0)
        f2 = fbeta_score(y_test, preds, beta=2, zero_division=0)  # weights recall 2x higher than precision
        n_flagged = preds.sum()
        rows.append({
            "threshold": round(t, 2),
            "precision": round(p, 3),
            "recall": round(r, 3),
            "f1": round(f1, 3),
            "f2": round(f2, 3),
            "n_flagged": int(n_flagged),
            "n_flagged_pct": round(100 * n_flagged / len(preds), 1),
        })

    results = pd.DataFrame(rows)
    print("\n" + "=" * 70)
    print("  FRAUD THRESHOLD SWEEP  (test set, n =", len(y_test), ", fraud rate =",
          round(100 * y_test.mean(), 2), "%)")
    print("=" * 70)
    print(results.to_string(index=False))

    # ── Recommend an operating point ───────────────────────────────────
    # F2 favors recall over precision -- appropriate for fraud, where a missed
    # fraud case (false negative) is typically far costlier than a false alarm
    # that a human analyst quickly clears.
    best_f2_row = results.loc[results["f2"].idxmax()]
    best_f1_row = results.loc[results["f1"].idxmax()]

    print("\n--- Recommended operating points ---")
    print(f"Best F1 (balanced):      threshold={best_f1_row['threshold']}  "
          f"precision={best_f1_row['precision']}  recall={best_f1_row['recall']}")
    print(f"Best F2 (recall-weighted): threshold={best_f2_row['threshold']}  "
          f"precision={best_f2_row['precision']}  recall={best_f2_row['recall']}")
    print("\nFor fraud specifically, F2 is usually the more defensible choice: "
          "missing a fraudulent transaction typically costs more than reviewing "
          "one extra false alarm.")

    # ── Precision-Recall curve + AUPRC ─────────────────────────────────
    prec_curve, rec_curve, pr_thresholds = precision_recall_curve(y_test, proba)
    auprc = auc(rec_curve, prec_curve)
    print(f"\nArea under Precision-Recall curve (AUPRC): {auprc:.4f}")
    print(f"(Baseline AUPRC for a random model at this fraud rate would be ~"
          f"{y_test.mean():.4f} -- compare against that, not against 0.5,"
          f" since PR curves are sensitive to class imbalance.)")

    # ── Plots ───────────────────────────────────────────────────────────
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    axes[0].plot(results["threshold"], results["precision"], marker="o", label="Precision")
    axes[0].plot(results["threshold"], results["recall"], marker="o", label="Recall")
    axes[0].plot(results["threshold"], results["f1"], marker="o", label="F1")
    axes[0].plot(results["threshold"], results["f2"], marker="o", label="F2")
    axes[0].axvline(best_f2_row["threshold"], color="gray", linestyle="--", alpha=0.6)
    axes[0].set_xlabel("Decision threshold")
    axes[0].set_ylabel("Score")
    axes[0].set_title("Precision / Recall / F1 / F2 vs. Threshold")
    axes[0].legend()
    axes[0].grid(alpha=0.3)

    axes[1].plot(rec_curve, prec_curve, color="darkred")
    axes[1].axhline(y_test.mean(), color="gray", linestyle="--", alpha=0.6, label="Random baseline")
    axes[1].set_xlabel("Recall")
    axes[1].set_ylabel("Precision")
    axes[1].set_title(f"Precision-Recall Curve (AUPRC = {auprc:.3f})")
    axes[1].legend()
    axes[1].grid(alpha=0.3)

    plt.tight_layout()
    fig_path = OUT_DIR / "fraud_threshold_tuning.png"
    plt.savefig(fig_path, dpi=150)
    print(f"\nSaved chart to {fig_path}")

    results.to_csv(OUT_DIR / "fraud_threshold_sweep.csv", index=False)
    print(f"Saved sweep table to {OUT_DIR / 'fraud_threshold_sweep.csv'}")


if __name__ == "__main__":
    main()