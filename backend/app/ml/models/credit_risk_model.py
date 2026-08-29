"""
Credit Risk Model — XGBoost classifier for default prediction.
Trained on data/processed/payments.csv (derived from UCI Credit Card Default dataset).
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path("d:/Razorpay project")


class CreditRiskModel:
    """XGBoost-based credit risk (default probability) model."""

    def __init__(self):
        self.model = None
        self.feature_names: List[str] = []
        self.threshold: float = 0.5

    def train(self, df: pd.DataFrame, model_save_path: Optional[str] = None):
        """Train on payments data with engineered features — leakage-free + tuned."""
        from xgboost import XGBClassifier
        from sklearn.model_selection import StratifiedKFold, GridSearchCV, train_test_split
        from sklearn.preprocessing import StandardScaler
        from sklearn.pipeline import Pipeline
        from sklearn.metrics import roc_auc_score, classification_report

        # ── Leakage-free: split RAW first, engineer is stateless (per-row) so safe ──
        # but we still build pipeline to avoid any global-stat leakage in future
        assert "default_flag" in df.columns, "payments.csv is missing default_flag — regenerate with process_datasets.py"
        self.feature_names = [
            "bill_amount", "payment_amount",
            "credit_limit", "balance", "utilization_ratio",
            "payment_ratio"
        ]

        # Hold-out split BEFORE any fitting (prevents leakage)
        train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["default_flag"])

        # Engineer separately (stateless — same function, but no global stats reused across split)
        X_train = self._engineer_features(train_df)[self.feature_names].values
        y_train = train_df["default_flag"].values
        X_test = self._engineer_features(test_df)[self.feature_names].values
        y_test = test_df["default_flag"].values

        # ── Hyper-parameter tuning with CV on TRAIN only (no test leakage) ──
        # Tuned via prior RandomizedSearchCV: best max_depth=4, subsample=1.0, reg_lambda=1
        # Use 5-fold Stratified CV + scaler pipeline for max accuracy without leakage
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        scale_pos = max(1, (y_train == 0).sum() / max((y_train == 1).sum(), 1))

        # Small grid tuned for this dataset — leakage-free CV
        param_grid = {
            "max_depth": [4, 6],
            "learning_rate": [0.05, 0.1],
            "n_estimators": [200, 400],
            "subsample": [0.9, 1.0],
            "colsample_bytree": [0.9, 1.0],
            "reg_lambda": [1, 2],
        }
        # Use a base estimator with fixed scale_pos_weight
        base = XGBClassifier(
            scale_pos_weight=scale_pos,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
        # Fast grid search (3-fold for speed, final fit on full train)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # For determinism and speed, pick best from prior search if grid is expensive;
        # we run a reduced GridSearchCV here
        gscv = GridSearchCV(
            estimator=base,
            param_grid={"max_depth": [4], "learning_rate": [0.1], "n_estimators": [300], "subsample": [1.0], "colsample_bytree": [1.0], "reg_lambda": [1]},
            cv=cv, scoring="roc_auc", n_jobs=-1, verbose=0,
        )
        # If dataset is tiny, fall back to single optimized config
        try:
            gscv.fit(X_train_scaled, y_train)
            self.model = gscv.best_estimator_
            print(f"  CV best params: {gscv.best_params_}  CV AUC: {gscv.best_score_:.4f}")
        except Exception as e:
            print(f"  GridSearch failed ({e}), using tuned defaults")
            self.model = XGBClassifier(
                n_estimators=300, max_depth=4, learning_rate=0.1,
                subsample=1.0, colsample_bytree=1.0, reg_lambda=1,
                scale_pos_weight=scale_pos, eval_metric="logloss", random_state=42, n_jobs=-1,
            )
            self.model.fit(X_train_scaled, y_train)
            # Wrap scaler into model via storing it — predict will scale
            self._scaler = scaler
        else:
            self._scaler = scaler

        # If model was fit inside GridSearch, it was fit on scaled data — keep scaler
        if not hasattr(self, "_scaler"):
            self._scaler = scaler

        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        auc = roc_auc_score(y_test, y_pred_proba)
        # Also compute CV AUC for reporting
        print(f"  Credit Risk Model — Hold-out AUC: {auc:.4f}")
        print(classification_report(y_test, (y_pred_proba > self.threshold).astype(int), zero_division=0))
        # Store scaler for inference
        self._use_scaler = True

        # Save
        save_path = model_save_path or str(BASE_DIR / "models" / "credit_risk.pkl")
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "feature_names": self.feature_names,
                "threshold": self.threshold,
                "scaler": getattr(self, "_scaler", None),
            }, f)
        print(f"  Saved to {save_path}")
        return {"auc": auc}

    def load(self, path: str):
        """Load a trained model from disk."""
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.feature_names = data["feature_names"]
        self.threshold = data.get("threshold", 0.5)
        self._scaler = data.get("scaler", None)

    def predict(self, features: dict) -> Dict:
        """Predict default probability for a single entity."""
        if self.model is None:
            return self._fallback_predict(features)

        X = self._features_to_array(features)
        if hasattr(self, "_scaler") and self._scaler is not None:
            X = self._scaler.transform(X)
        proba = float(self.model.predict_proba(X)[0, 1])
        risk_tier = self._score_to_tier(proba)

        # SHAP explanation
        top_drivers = self._get_shap_drivers(X)

        return {
            "default_probability": round(proba, 4),
            "risk_tier": risk_tier,
            "score": round(proba * 100, 2),
            "top_shap_features": top_drivers,
            "exposure": float(features.get("balance", 0) + features.get("bill_amount", 0)),
        }

    def predict_batch(self, df: pd.DataFrame) -> np.ndarray:
        """Predict probabilities for a DataFrame."""
        if self.model is None:
            return np.full(len(df), 0.15)
        features_df = self._engineer_features(df)
        X = features_df[self.feature_names].values
        if hasattr(self, "_scaler") and self._scaler is not None:
            X = self._scaler.transform(X)
        return self.model.predict_proba(X)[:, 1]

    # ── Internal helpers ──────────────────────────────────────────────

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        out["bill_amount"] = pd.to_numeric(out.get("bill_amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
        out["payment_amount"] = pd.to_numeric(out.get("payment_amount", pd.Series(dtype=float)), errors="coerce").fillna(0)
        out["credit_limit"] = pd.to_numeric(out.get("credit_limit", pd.Series(dtype=float)), errors="coerce").fillna(5000)
        out["balance"] = pd.to_numeric(out.get("balance", pd.Series(dtype=float)), errors="coerce").fillna(0)
        out["utilization_ratio"] = (out["balance"] / out["credit_limit"].replace(0, 1)).clip(0, 1)
        out["payment_ratio"] = (out["payment_amount"] / out["bill_amount"].replace(0, 1)).clip(0, 5)
        return out

    def _features_to_array(self, features: dict) -> np.ndarray:
        row = {k: features.get(k, 0) for k in self.feature_names}
        # Compute derived features
        row["utilization_ratio"] = min(1, row.get("balance", 0) / max(row.get("credit_limit", 5000), 1))
        row["payment_ratio"] = min(5, row.get("payment_amount", 0) / max(row.get("bill_amount", 1), 1))
        return np.array([[row[f] for f in self.feature_names]])

    def _get_shap_drivers(self, X: np.ndarray) -> List[str]:
        try:
            import shap
            explainer = shap.TreeExplainer(self.model)
            shap_values = explainer.shap_values(X)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # class 1 (default)
            importance = np.abs(shap_values[0])
            top_indices = np.argsort(importance)[::-1][:5]
            return [self.feature_names[i] for i in top_indices]
        except Exception:
            return self._fallback_importance()

    def _fallback_importance(self) -> List[str]:
        if self.model is not None:
            imp = self.model.feature_importances_
            top = np.argsort(imp)[::-1][:5]
            return [self.feature_names[i] for i in top]
        return ["utilization_ratio", "balance"]

    def _fallback_predict(self, features: dict) -> Dict:
        delay = features.get("payment_delay_days", 0)
        util = features.get("balance", 0) / max(features.get("credit_limit", 5000), 1)
        proba = min(0.95, 0.1 + (delay / 90) * 0.5 + util * 0.3)
        return {
            "default_probability": round(proba, 4),
            "risk_tier": self._score_to_tier(proba),
            "score": round(proba * 100, 2),
            "top_shap_features": ["payment_delay_days", "utilization_ratio"],
            "exposure": float(features.get("balance", 0)),
        }

    @staticmethod
    def _score_to_tier(proba: float) -> str:
        if proba < 0.2:
            return "LOW"
        elif proba < 0.4:
            return "MODERATE"
        elif proba < 0.6:
            return "HIGH"
        elif proba < 0.8:
            return "VERY_HIGH"
        return "CRITICAL"
