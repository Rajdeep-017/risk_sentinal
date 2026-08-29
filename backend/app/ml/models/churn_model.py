"""
Churn Model — LightGBM classifier for customer churn prediction.
Trained on data/processed/customers.csv (derived from Telco Customer Churn).
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path("d:/Razorpay project")


class ChurnModel:
    """LightGBM-based customer churn prediction model."""

    def __init__(self):
        self.model = None
        self.feature_names: List[str] = []
        self.label_encoders: Dict = {}
        self.threshold: float = 0.5

    def train(self, df: pd.DataFrame, model_save_path: Optional[str] = None):
        """Train on customers data — leakage-free + tuned."""
        from lightgbm import LGBMClassifier
        from sklearn.model_selection import StratifiedKFold, GridSearchCV, train_test_split
        from sklearn.metrics import roc_auc_score, classification_report
        from sklearn.preprocessing import LabelEncoder

        # ── Leakage-free: split RAW first, fit encoders only on train ──
        cat_cols = ["segment", "education", "marital_status", "internet_service",
                    "contract_type", "payment_method", "phone_service"]
        train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["churn_flag"])

        # Fit encoders ONLY on train
        self.label_encoders = {}
        for col in cat_cols:
            if col in train_df.columns:
                le = LabelEncoder()
                # Fit on train only
                le.fit(train_df[col].astype(str))
                self.label_encoders[col] = le

        # Engineer features separately for train/test using fitted encoders
        def _prep(dframe):
            fdf = dframe.copy()
            for col, le in self.label_encoders.items():
                if col in fdf.columns:
                    # Transform with unknowns mapped to -1 then 0
                    fdf[col + "_enc"] = fdf[col].astype(str).apply(
                        lambda x, _le=le: _le.transform([x])[0] if x in _le.classes_ else -1
                    )
            fdf["charge_ratio"] = (fdf["monthly_charges"] / fdf["total_charges"].replace(0, 1)).clip(0, 1)
            fdf["tenure_bucket"] = pd.cut(
                fdf["tenure_months"], bins=[0, 6, 12, 24, 48, 72, 999], labels=[0, 1, 2, 3, 4, 5]
            ).astype(int)
            # Additional engineered signals to maximize accuracy without leakage
            fdf["high_value_risk"] = ((fdf["monthly_charges"] > 80) & (fdf["contract_type"] == "Month-to-month")).astype(int)
            fdf["tenure_charge_interaction"] = fdf["tenure_months"] * fdf["monthly_charges"] / 1000.0
            return fdf

        train_prep = _prep(train_df)
        test_prep = _prep(test_df)

        self.feature_names = [
            "tenure_months", "monthly_charges", "total_charges",
            "credit_utilization", "age", "charge_ratio", "tenure_bucket",
            "high_value_risk", "tenure_charge_interaction",
        ]
        for col in cat_cols:
            enc_col = col + "_enc"
            if enc_col in train_prep.columns:
                self.feature_names.append(enc_col)
        available = [f for f in self.feature_names if f in train_prep.columns]
        self.feature_names = available

        X_train = train_prep[self.feature_names].values
        y_train = train_prep["churn_flag"].values
        X_test = test_prep[self.feature_names].values
        y_test = test_prep["churn_flag"].values

        # ── Tuned hyperparams (leakage-free CV) ──
        # Best from RandomizedSearchCV: n_estimators=300, max_depth=5, etc. Add regularization
        scale_pos = max(1, (y_train == 0).sum() / max((y_train == 1).sum(), 1))
        base = LGBMClassifier(
            n_estimators=300, max_depth=5, learning_rate=0.05, num_leaves=31,
            subsample=0.9, colsample_bytree=0.9, reg_alpha=0.1, reg_lambda=0.1,
            scale_pos_weight=scale_pos, random_state=42, verbose=-1,
        )
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # Small grid — optimal already found, verify CV score
        gscv = GridSearchCV(base, param_grid={"n_estimators": [300], "max_depth": [5], "learning_rate": [0.05]}, cv=cv, scoring="roc_auc", n_jobs=-1)
        try:
            gscv.fit(X_train, y_train)
            self.model = gscv.best_estimator_
            print(f"  CV best params: {gscv.best_params_}  CV AUC: {gscv.best_score_:.4f}")
        except Exception as e:
            print(f"  GridSearch failed ({e}), using tuned defaults")
            self.model = base
            self.model.fit(X_train, y_train)

        # Fallback fit if GridSearch didn't fit due to error
        if not hasattr(self.model, "feature_importances_"):
            self.model.fit(X_train, y_train)

        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_pred_proba)
        print(f"  Churn Model — Hold-out AUC: {auc:.4f}")
        print(classification_report(y_test, (y_pred_proba > self.threshold).astype(int), zero_division=0))
        # Calibrate threshold for best F1 on train CV
        from sklearn.metrics import f1_score
        best_f1, best_t = 0, 0.5
        for t in np.arange(0.3, 0.7, 0.05):
            preds = (self.model.predict_proba(X_train)[:, 1] >= t).astype(int)
            f1 = f1_score(y_train, preds, zero_division=0)
            if f1 > best_f1:
                best_f1, best_t = f1, t
        print(f"  Optimal threshold (train F1): {best_t:.2f} (F1={best_f1:.3f}) — keeping 0.5 for consistency, but logged")

        save_path = model_save_path or str(BASE_DIR / "models" / "churn.pkl")
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "feature_names": self.feature_names,
                "label_encoders": self.label_encoders,
                "threshold": self.threshold,
            }, f)
        print(f"  Saved to {save_path}")
        return {"auc": auc}

    def load(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.feature_names = data["feature_names"]
        self.label_encoders = data.get("label_encoders", {})
        self.threshold = data.get("threshold", 0.5)

    def predict(self, features: dict) -> Dict:
        """Predict churn probability for a single customer."""
        if self.model is None:
            return self._fallback_predict(features)

        X = self._features_to_array(features)
        proba = float(self.model.predict_proba(X)[0, 1])

        # Identify risk signals
        signals = self._identify_signals(features, proba)
        top_drivers = self._get_shap_drivers(X)

        monthly = features.get("monthly_charges", 89.5)
        tenure = features.get("tenure_months", 12)
        revenue_exposure = monthly * max(12 - tenure % 12, 6)

        return {
            "churn_probability": round(proba, 4),
            "risk_signals": signals,
            "revenue_exposure": round(revenue_exposure, 2),
            "score": round(proba * 100, 2),
            "top_shap_features": top_drivers,
        }

    def predict_batch(self, df: pd.DataFrame) -> np.ndarray:
        if self.model is None:
            return np.full(len(df), 0.22)
        X = self._prepare_batch(df)
        return self.model.predict_proba(X)[:, 1]

    # ── Internal helpers ──────────────────────────────────────────────

    def _prepare_batch(self, df: pd.DataFrame) -> np.ndarray:
        features_df = df.copy()
        for col, le in self.label_encoders.items():
            if col in features_df.columns:
                enc_col = col + "_enc"
                features_df[enc_col] = features_df[col].astype(str).map(
                    lambda x, _le=le: _le.transform([x])[0] if x in _le.classes_ else -1
                )
        features_df["charge_ratio"] = (
            features_df.get("monthly_charges", pd.Series(0)) /
            features_df.get("total_charges", pd.Series(1)).replace(0, 1)
        ).clip(0, 1)
        features_df["tenure_bucket"] = pd.cut(
            features_df.get("tenure_months", pd.Series(12)),
            bins=[0, 6, 12, 24, 48, 72, 999],
            labels=[0, 1, 2, 3, 4, 5]
        ).astype(int)
        features_df["high_value_risk"] = ((features_df.get("monthly_charges", pd.Series(0)) > 80) & (features_df.get("contract_type", pd.Series("")) == "Month-to-month")).astype(int)
        features_df["tenure_charge_interaction"] = features_df.get("tenure_months", pd.Series(12)) * features_df.get("monthly_charges", pd.Series(50)) / 1000.0
        available = [f for f in self.feature_names if f in features_df.columns]
        # Ensure all features present, fill missing with 0
        for f in self.feature_names:
            if f not in features_df.columns:
                features_df[f] = 0
        return features_df[self.feature_names].values

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
                    row[f] = -1
            elif f == "charge_ratio":
                row[f] = features.get("monthly_charges", 0) / max(features.get("total_charges", 1), 1)
            elif f == "tenure_bucket":
                t = features.get("tenure_months", 12)
                if t <= 6: row[f] = 0
                elif t <= 12: row[f] = 1
                elif t <= 24: row[f] = 2
                elif t <= 48: row[f] = 3
                elif t <= 72: row[f] = 4
                else: row[f] = 5
            elif f == "high_value_risk":
                row[f] = 1 if (features.get("monthly_charges", 0) > 80 and features.get("contract_type") == "Month-to-month") else 0
            elif f == "tenure_charge_interaction":
                row[f] = features.get("tenure_months", 12) * features.get("monthly_charges", 50) / 1000.0
            else:
                row[f] = features.get(f, 0)
        return np.array([[row[f] for f in self.feature_names]])

    def _identify_signals(self, features: dict, proba: float) -> List[str]:
        signals = []
        if features.get("tenure_months", 99) < 12:
            signals.append("short_tenure")
        if features.get("monthly_charges", 0) > 80:
            signals.append("high_charges")
        if features.get("contract_type", "") == "Month-to-month":
            signals.append("month_to_month_contract")
        if features.get("credit_utilization", 0) > 0.7:
            signals.append("high_credit_utilization")
        if proba > 0.6:
            signals.append("high_churn_risk")
        return signals if signals else ["normal_behavior"]

    def _get_shap_drivers(self, X: np.ndarray) -> List[str]:
        try:
            import shap
            explainer = shap.TreeExplainer(self.model)
            shap_values = explainer.shap_values(X)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            importance = np.abs(shap_values[0])
            top_indices = np.argsort(importance)[::-1][:5]
            return [self.feature_names[i] for i in top_indices]
        except Exception:
            if self.model is not None:
                imp = self.model.feature_importances_
                top = np.argsort(imp)[::-1][:5]
                return [self.feature_names[i] for i in top]
            return ["tenure_months", "monthly_charges", "contract_type"]

    def _fallback_predict(self, features: dict) -> Dict:
        tenure = features.get("tenure_months", 24)
        charges = features.get("monthly_charges", 50)
        proba = min(0.95, 0.05 + (1 - tenure / 72) * 0.4 + (charges / 150) * 0.2)
        return {
            "churn_probability": round(proba, 4),
            "risk_signals": self._identify_signals(features, proba),
            "revenue_exposure": round(charges * 12, 2),
            "score": round(proba * 100, 2),
            "top_shap_features": ["tenure_months", "monthly_charges"],
        }
