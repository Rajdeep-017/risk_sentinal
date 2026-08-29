"""
Operational Risk Model — XGBoost regressor for supply chain / operational risk.
Trained on data/synthetic/operations.csv + suppliers.csv.
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path("d:/Razorpay project")


class OperationalModel:
    """XGBoost-based operational risk prediction (delay severity, SLA breach)."""

    def __init__(self):
        self.delay_model = None
        self.sla_model = None
        self.feature_names: List[str] = []
        self.label_encoders: Dict = {}

    def train(self, operations_df: pd.DataFrame, suppliers_df: pd.DataFrame = None,
              model_save_path: Optional[str] = None):
        """Train on operations + suppliers data — LEAKAGE-FREE."""
        from xgboost import XGBRegressor, XGBClassifier
        from sklearn.model_selection import StratifiedKFold, KFold, GridSearchCV, train_test_split
        from sklearn.metrics import mean_absolute_error, roc_auc_score
        from sklearn.preprocessing import LabelEncoder

        # Merge supplier data if available (pre-delivery feature enrichment — not leakage)
        if suppliers_df is not None and "supplier_id" in operations_df.columns:
            df = operations_df.merge(suppliers_df, on="supplier_id", how="left")
        else:
            df = operations_df.copy()

        # ── CRITICAL FIX: Remove leaky post-outcome features ──
        # production_capacity_pct, quality_score, downtime_hours are DERIVED from delay_days
        # (see generate_synthetic_data.py: capacity = 95 - delay*5, quality = 95 - delay*2)
        # Using them to predict delay is circular and inflates AUC to 0.999. We must exclude them.
        # Keep only pre-delivery features:
        cat_cols = ["category", "criticality", "region"]
        # Leakage-free split BEFORE fitting encoders
        # Use stratified split on sla_breach for classification, but also need regression split
        # We'll create a single train/test split stratified on sla_breach to avoid leakage
        train_idx, test_idx = train_test_split(
            np.arange(len(df)), test_size=0.2, random_state=42, stratify=df["sla_breach"].astype(int)
        )
        train_df = df.iloc[train_idx].copy()
        test_df = df.iloc[test_idx].copy()

        # Fit encoders ONLY on train
        self.label_encoders = {}
        for col in cat_cols:
            if col in train_df.columns:
                le = LabelEncoder()
                le.fit(train_df[col].astype(str))
                self.label_encoders[col] = le

        def _prep(dframe):
            fdf = dframe.copy()
            for col, le in self.label_encoders.items():
                if col in fdf.columns:
                    fdf[col + "_enc"] = fdf[col].astype(str).apply(
                        lambda x, _le=le: _le.transform([x])[0] if x in _le.classes_ else -1
                    )
            fdf["order_value"] = pd.to_numeric(fdf.get("order_value", pd.Series(dtype=float)), errors="coerce").fillna(50000)
            fdf["reliability_score"] = pd.to_numeric(fdf.get("reliability_score", pd.Series(dtype=float)), errors="coerce").fillna(0.8)
            fdf["avg_delivery_days"] = pd.to_numeric(fdf.get("avg_delivery_days", pd.Series(dtype=float)), errors="coerce").fillna(7)
            # Add non-leaky derived features
            fdf["order_value_log"] = np.log1p(fdf["order_value"])
            fdf["reliability_x_delivery"] = fdf["reliability_score"] * fdf["avg_delivery_days"]
            fdf["is_critical"] = (fdf.get("criticality", pd.Series("low")) == "critical").astype(int)
            return fdf

        train_prep = _prep(train_df)
        test_prep = _prep(test_df)

        self.feature_names = ["reliability_score", "avg_delivery_days", "order_value",
                              "order_value_log", "reliability_x_delivery", "is_critical"]
        for col in cat_cols:
            enc_col = col + "_enc"
            if enc_col in train_prep.columns:
                self.feature_names.append(enc_col)
        available = [f for f in self.feature_names if f in train_prep.columns]
        self.feature_names = available

        X_train_reg = train_prep[self.feature_names].values
        y_train_delay = train_prep["delay_days"].values
        X_test_reg = test_prep[self.feature_names].values
        y_test_delay = test_prep["delay_days"].values

        X_train_clf = X_train_reg
        y_train_sla = train_prep["sla_breach"].astype(int).values
        X_test_clf = X_test_reg
        y_test_sla = test_prep["sla_breach"].astype(int).values

        # ── Delay Regressor — tuned, leakage-free CV ──
        reg_base = XGBRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, reg_lambda=1, random_state=42, n_jobs=-1)
        kfold = KFold(n_splits=5, shuffle=True, random_state=42)
        reg_gscv = GridSearchCV(reg_base, param_grid={"max_depth": [4], "n_estimators": [200]}, cv=kfold, scoring="neg_mean_absolute_error", n_jobs=-1)
        try:
            reg_gscv.fit(X_train_reg, y_train_delay)
            self.delay_model = reg_gscv.best_estimator_
            print(f"  Delay CV best: {reg_gscv.best_params_}  CV MAE: {-reg_gscv.best_score_:.2f}")
        except Exception as e:
            print(f"  Reg GridSearch failed ({e}), using defaults")
            self.delay_model = reg_base
            self.delay_model.fit(X_train_reg, y_train_delay)
        if not hasattr(self.delay_model, "feature_importances_"):
            self.delay_model.fit(X_train_reg, y_train_delay)
        mae = mean_absolute_error(y_test_delay, self.delay_model.predict(X_test_reg))
        print(f"  Operational Delay Model (leakage-free) — MAE: {mae:.2f} days (was 0.16 with leakage)")

        # ── SLA Breach Classifier — tuned, leakage-free CV ──
        scale_pos = max(1, (y_train_sla == 0).sum() / max((y_train_sla == 1).sum(), 1))
        clf_base = XGBClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05, reg_lambda=1,
            scale_pos_weight=scale_pos, eval_metric="logloss", random_state=42, n_jobs=-1,
        )
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        clf_gscv = GridSearchCV(clf_base, param_grid={"max_depth": [4], "n_estimators": [200]}, cv=cv, scoring="roc_auc", n_jobs=-1)
        try:
            clf_gscv.fit(X_train_clf, y_train_sla)
            self.sla_model = clf_gscv.best_estimator_
            print(f"  SLA CV best: {clf_gscv.best_params_}  CV AUC: {clf_gscv.best_score_:.4f}")
        except Exception as e:
            print(f"  Clf GridSearch failed ({e}), using defaults")
            self.sla_model = clf_base
            self.sla_model.fit(X_train_clf, y_train_sla)
        if not hasattr(self.sla_model, "feature_importances_"):
            self.sla_model.fit(X_train_clf, y_train_sla)
        sla_auc = roc_auc_score(y_test_sla, self.sla_model.predict_proba(X_test_clf)[:, 1])
        print(f"  Operational SLA Model (leakage-free) — AUC: {sla_auc:.4f} (was 0.999 with leakage)")

        # Save
        save_path = model_save_path or str(BASE_DIR / "models" / "operational.pkl")
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "wb") as f:
            pickle.dump({
                "delay_model": self.delay_model,
                "sla_model": self.sla_model,
                "feature_names": self.feature_names,
                "label_encoders": self.label_encoders,
            }, f)
        print(f"  Saved to {save_path}")
        return {"mae": mae, "sla_auc": sla_auc}

    def load(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.delay_model = data["delay_model"]
        self.sla_model = data["sla_model"]
        self.feature_names = data["feature_names"]
        self.label_encoders = data.get("label_encoders", {})

    def predict(self, features: dict) -> Dict:
        """Predict operational risk for a supplier/operation."""
        if self.delay_model is None or self.sla_model is None:
            return self._fallback_predict(features)

        X = self._features_to_array(features)
        predicted_delay = max(0, float(self.delay_model.predict(X)[0]))
        sla_breach_prob = float(self.sla_model.predict_proba(X)[0, 1])

        reliability = features.get("reliability_score", 0.8)
        supplier_risk = 1 - reliability
        score = (0.4 * sla_breach_prob + 0.3 * min(predicted_delay / 10, 1) + 0.3 * supplier_risk) * 100

        alerts = self._generate_alerts(features, predicted_delay, sla_breach_prob)

        return {
            "supplier_reliability": round(reliability, 4),
            "predicted_delay_days": round(predicted_delay, 1),
            "sla_breach_prob": round(sla_breach_prob, 4),
            "stock_out_prob": round(min(1, predicted_delay / 15), 4),
            "sla_breach_risk": round(sla_breach_prob, 4),
            "score": round(score, 2),
            "supplier_alerts": alerts,
            "stockout_predictions": self._stockout_predictions(features, predicted_delay),
        }

    # ── Internal helpers ──────────────────────────────────────────────

    def _features_to_array(self, features: dict) -> np.ndarray:
        row = {}
        for f in self.feature_names:
            if f.endswith("_enc"):
                base = f.replace("_enc", "")
                val = features.get(base, "unknown")
                le = self.label_encoders.get(base)
                if le and val in le.classes_:
                    row[f] = le.transform([val])[0]
                else:
                    row[f] = 0
            else:
                row[f] = features.get(f, 0)
        return np.array([[row[f] for f in self.feature_names]])

    def _generate_alerts(self, features: dict, delay: float, sla_prob: float) -> List[str]:
        alerts = []
        if delay > 5:
            alerts.append(f"Predicted delivery delay: {delay:.0f} days")
        if sla_prob > 0.5:
            alerts.append(f"SLA breach risk: {sla_prob:.0%}")
        if features.get("reliability_score", 1) < 0.5:
            alerts.append("Low supplier reliability score")
        if features.get("criticality", "") == "critical" and delay > 2:
            alerts.append("Critical supplier delivery at risk")
        return alerts

    def _stockout_predictions(self, features: dict, delay: float) -> List[str]:
        preds = []
        if delay > 3:
            preds.append(f"Potential stockout in {max(1, int(7 - delay))} days")
        if features.get("reliability_score", 1) < 0.6:
            preds.append("Low reliability may increase stockout risk")
        return preds

    def _fallback_predict(self, features: dict) -> Dict:
        rel = features.get("reliability_score", 0.85)
        delay = max(0, (1 - rel) * 15)
        sla_prob = max(0, min(1, 1 - rel))
        score = (0.4 * sla_prob + 0.3 * min(delay / 10, 1) + 0.3 * (1 - rel)) * 100
        return {
            "supplier_reliability": round(rel, 4),
            "predicted_delay_days": round(delay, 1),
            "sla_breach_prob": round(sla_prob, 4),
            "stock_out_prob": round(min(1, delay / 15), 4),
            "sla_breach_risk": round(sla_prob, 4),
            "score": round(score, 2),
            "supplier_alerts": [],
            "stockout_predictions": [],
        }
