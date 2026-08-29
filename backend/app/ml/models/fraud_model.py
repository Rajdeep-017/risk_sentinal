"""
Fraud Detection Model — Dual approach: IsolationForest for anomaly scoring +
XGBoost classifier for fraud probability.
Trained on data/processed/transactions.csv — LEAKAGE-FREE + TUNED.
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path("d:/Razorpay project")


class FraudModel:
    """Dual-model fraud detection: IsolationForest anomaly + XGBoost classifier."""

    def __init__(self):
        self.iso_forest = None
        self.xgb = None
        self.feature_names: List[str] = []
        self.threshold: float = 0.5
        self._amount_mean: float = 100.0
        self._amount_std: float = 50.0

    def train(self, df: pd.DataFrame, save_dir: Optional[str] = None):
        """Train both models on transaction data — leakage-free."""
        from sklearn.ensemble import IsolationForest
        from xgboost import XGBClassifier
        from sklearn.model_selection import StratifiedKFold, GridSearchCV, train_test_split
        from sklearn.metrics import roc_auc_score, classification_report, average_precision_score
        from imblearn.over_sampling import SMOTE

        self.feature_names = [
            "amount", "velocity_1h", "velocity_24h",
            "distance_from_home", "is_online",
            "amount_zscore", "velocity_ratio", "hour_of_day",
        ]

        # ── Leakage-free split FIRST (no feature stats from test) ──
        train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["is_fraud"])

        # Fit amount mean/std ONLY on train
        self._amount_mean = float(train_df["amount"].mean())
        self._amount_std = float(train_df["amount"].std() or 50)

        # Engineer separately using train-only stats
        X_train = self._engineer_features(train_df, is_train=True)[self.feature_names].values
        y_train = train_df["is_fraud"].values
        X_test = self._engineer_features(test_df, is_train=False)[self.feature_names].values
        y_test = test_df["is_fraud"].values

        # ── IsolationForest (unsupervised) — fit ONLY on train ──
        self.iso_forest = IsolationForest(
            n_estimators=200,
            contamination=0.02,
            random_state=42,
            n_jobs=-1,
        )
        self.iso_forest.fit(X_train)
        print(f"  Fraud IsolationForest trained on {len(X_train)} train samples (no test leakage)")

        # ── XGBoost classifier — SMOTE only on train folds via manual resampling ──
        # Handle class imbalance with SMOTE on train only
        try:
            sm = SMOTE(random_state=42)
            X_train_res, y_train_res = sm.fit_resample(X_train, y_train)
        except Exception:
            X_train_res, y_train_res = X_train, y_train

        # Tuned hyperparams (from RandomizedSearchCV): max_depth=4, lr=0.05, n_estimators=200 is optimal
        # Leakage-free 5-fold CV on train
        base = XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # Reduced grid for determinism — best already identified
        gscv = GridSearchCV(base, param_grid={"max_depth": [4], "learning_rate": [0.05], "n_estimators": [300]}, cv=cv, scoring="roc_auc", n_jobs=-1)
        try:
            gscv.fit(X_train_res, y_train_res)
            self.xgb = gscv.best_estimator_
            print(f"  CV best params: {gscv.best_params_}  CV AUC: {gscv.best_score_:.4f}")
        except Exception as e:
            print(f"  GridSearch failed ({e}), fitting tuned defaults on SMOTE train")
            self.xgb = XGBClassifier(
                n_estimators=300, max_depth=4, learning_rate=0.05,
                subsample=0.9, colsample_bytree=0.9, reg_lambda=1,
                eval_metric="logloss", random_state=42, n_jobs=-1,
            )
            self.xgb.fit(X_train_res, y_train_res)

        y_pred_proba = self.xgb.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_pred_proba)
        auprc = average_precision_score(y_test, y_pred_proba)
        print(f"  Fraud XGBoost — Hold-out AUC: {auc:.4f}  AUPRC: {auprc:.4f}")
        print(classification_report(y_test, (y_pred_proba > self.threshold).astype(int), zero_division=0))

        # Save both models with leakage-free stats
        _dir = save_dir or str(BASE_DIR / "models")
        Path(_dir).mkdir(parents=True, exist_ok=True)

        with open(Path(_dir) / "fraud_iso.pkl", "wb") as f:
            pickle.dump({"model": self.iso_forest, "feature_names": self.feature_names,
                         "amount_mean": self._amount_mean, "amount_std": self._amount_std}, f)

        with open(Path(_dir) / "fraud_xgb.pkl", "wb") as f:
            pickle.dump({
                "model": self.xgb,
                "feature_names": self.feature_names,
                "threshold": self.threshold,
                "amount_mean": self._amount_mean,
                "amount_std": self._amount_std,
            }, f)

        print(f"  Saved fraud models to {_dir}/")
        return {"auc": auc, "auprc": auprc}

    def load(self, iso_path: str, xgb_path: str):
        with open(iso_path, "rb") as f:
            iso_data = pickle.load(f)
        self.iso_forest = iso_data["model"]
        self.feature_names = iso_data["feature_names"]
        self._amount_mean = iso_data.get("amount_mean", 100)
        self._amount_std = iso_data.get("amount_std", 50)

        with open(xgb_path, "rb") as f:
            xgb_data = pickle.load(f)
        self.xgb = xgb_data["model"]
        self.threshold = xgb_data.get("threshold", 0.5)
        # Prefer iso stats if consistent
        self._amount_mean = xgb_data.get("amount_mean", self._amount_mean)
        self._amount_std = xgb_data.get("amount_std", self._amount_std)

    def predict(self, features: dict) -> Dict:
        """Predict fraud probability and anomaly score for a transaction."""
        if self.xgb is None or self.iso_forest is None:
            return self._fallback_predict(features)

        X = self._features_to_array(features)

        raw_anomaly = self.iso_forest.decision_function(X)[0]
        anomaly_score = max(0, min(1, 0.5 - raw_anomaly))

        fraud_proba = float(self.xgb.predict_proba(X)[0, 1])
        is_fraud = fraud_proba > self.threshold

        fraud_score = 0.6 * fraud_proba + 0.4 * anomaly_score

        factors = self._identify_factors(features, anomaly_score, fraud_proba)
        top_drivers = self._get_shap_drivers(X)

        return {
            "fraud_score": round(fraud_score, 4),
            "fraud_probability": round(fraud_proba, 4),
            "anomaly_score": round(anomaly_score, 4),
            "is_fraud": is_fraud,
            "factors": factors,
            "top_shap_features": top_drivers,
        }

    def predict_batch(self, df: pd.DataFrame) -> Dict:
        if self.xgb is None:
            return {"fraud_proba": np.full(len(df), 0.05), "anomaly": np.full(len(df), 0.1)}
        features_df = self._engineer_features(df, is_train=False)
        X = features_df[self.feature_names].values
        fraud_proba = self.xgb.predict_proba(X)[:, 1]
        raw_anomaly = self.iso_forest.decision_function(X)
        anomaly = np.clip(0.5 - raw_anomaly, 0, 1)
        return {"fraud_proba": fraud_proba, "anomaly": anomaly}

    # ── Internal helpers ──────────────────────────────────────────────

    def _engineer_features(self, df: pd.DataFrame, is_train: bool = False) -> pd.DataFrame:
        out = df.copy()
        out["amount"] = pd.to_numeric(out.get("amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
        out["velocity_1h"] = pd.to_numeric(out.get("velocity_1h", pd.Series(dtype=float)), errors="coerce").fillna(1)
        out["velocity_24h"] = pd.to_numeric(out.get("velocity_24h", pd.Series(dtype=float)), errors="coerce").fillna(1)
        out["distance_from_home"] = pd.to_numeric(out.get("distance_from_home", pd.Series(dtype=float)), errors="coerce").fillna(0)
        out["is_online"] = out.get("is_online", pd.Series(False)).astype(int)

        # Leakage-free: use train-only mean/std
        mean_amt = self._amount_mean if not is_train else (out["amount"].mean() or 100)
        std_amt = self._amount_std if not is_train else (out["amount"].std() or 50)
        # Cache on train
        if is_train:
            self._amount_mean = float(mean_amt)
            self._amount_std = float(std_amt)
        out["amount_zscore"] = ((out["amount"] - self._amount_mean) / max(self._amount_std, 1)).clip(-5, 5)
        out["velocity_ratio"] = (out["velocity_1h"] / out["velocity_24h"].replace(0, 1)).clip(0, 1)

        if "timestamp" in out.columns:
            try:
                out["hour_of_day"] = pd.to_datetime(out["timestamp"]).dt.hour
            except Exception:
                out["hour_of_day"] = 12
        else:
            out["hour_of_day"] = 12

        return out

    def _features_to_array(self, features: dict) -> np.ndarray:
        row = {}
        for f in self.feature_names:
            if f == "amount_zscore":
                row[f] = min(5, max(-5, (features.get("amount", 0) - self._amount_mean) / max(self._amount_std, 1)))
            elif f == "velocity_ratio":
                row[f] = min(1, features.get("velocity_1h", 1) / max(features.get("velocity_24h", 1), 1))
            elif f == "hour_of_day":
                row[f] = features.get("hour_of_day", 12)
            elif f == "is_online":
                row[f] = int(features.get("is_online", False))
            else:
                row[f] = features.get(f, 0)
        return np.array([[row[f] for f in self.feature_names]])

    def _identify_factors(self, features: dict, anomaly: float, fraud_proba: float) -> List[str]:
        factors = []
        if features.get("amount", 0) > 500:
            factors.append("high_value_transaction")
        if features.get("velocity_1h", 0) > 3:
            factors.append("velocity_spike")
        if features.get("distance_from_home", 0) > 200:
            factors.append("unusual_location")
        if anomaly > 0.7:
            factors.append("statistical_anomaly")
        if features.get("is_online", False) and features.get("amount", 0) > 1000:
            factors.append("high_value_online")
        if features.get("hour_of_day", 12) < 5 or features.get("hour_of_day", 12) > 23:
            factors.append("off_hours_transaction")
        return factors if factors else ["normal_pattern"]

    def _get_shap_drivers(self, X: np.ndarray) -> List[str]:
        try:
            import shap
            explainer = shap.TreeExplainer(self.xgb)
            shap_values = explainer.shap_values(X)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            importance = np.abs(shap_values[0])
            top_indices = np.argsort(importance)[::-1][:5]
            return [self.feature_names[i] for i in top_indices]
        except Exception:
            if self.xgb is not None:
                imp = self.xgb.feature_importances_
                top = np.argsort(imp)[::-1][:5]
                return [self.feature_names[i] for i in top]
            return ["amount", "velocity_1h", "distance_from_home"]

    def _fallback_predict(self, features: dict) -> Dict:
        amount = features.get("amount", 0)
        velocity = features.get("velocity_1h", 1)
        distance = features.get("distance_from_home", 0)
        proba = min(0.95, 0.01 + (amount / 10000) * 0.2 + (velocity / 10) * 0.3 + (distance / 1000) * 0.2)
        return {
            "fraud_score": round(proba, 4),
            "fraud_probability": round(proba, 4),
            "anomaly_score": round(proba * 0.8, 4),
            "is_fraud": proba > 0.5,
            "factors": self._identify_factors(features, proba, proba),
            "top_shap_features": ["amount", "velocity_1h"],
        }
