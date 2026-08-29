"""
Cyber Risk Model — RandomForestClassifier for network attack detection.
Trained on data/processed/cyber_events.csv (derived from UNSW-NB15).
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path("d:/Razorpay project")


class CyberModel:
    """RandomForest-based cyber threat detection model."""

    def __init__(self):
        self.rf = None
        self.feature_names: List[str] = []
        self.label_encoders: Dict = {}
        self.attack_categories: List[str] = []

    def train(self, df: pd.DataFrame, model_save_path: Optional[str] = None):
        """Train on cyber events data — leakage-free + tuned."""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import StratifiedKFold, GridSearchCV, train_test_split
        from sklearn.metrics import roc_auc_score, classification_report
        from sklearn.preprocessing import LabelEncoder

        self.attack_categories = list(df["attack_category"].unique())
        cat_cols = ["protocol", "service"]

        # ── Leakage-free: split RAW first, fit encoders only on train ──
        train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["is_attack"])
        self.label_encoders = {}
        for col in cat_cols:
            if col in train_df.columns:
                le = LabelEncoder()
                le.fit(train_df[col].astype(str))
                self.label_encoders[col] = le

        def _engineer(dframe):
            fdf = dframe.copy()
            for col, le in self.label_encoders.items():
                if col in fdf.columns:
                    fdf[col + "_enc"] = fdf[col].astype(str).apply(
                        lambda x, _le=le: _le.transform([x])[0] if x in _le.classes_ else -1
                    )
            fdf["traffic_ratio"] = (fdf["src_bytes"] / fdf["dst_bytes"].replace(0, 1)).clip(0, 100)
            fdf["bytes_total"] = fdf["src_bytes"] + fdf["dst_bytes"]
            # Additional non-leaky features to maximize signal
            fdf["bytes_per_sec"] = fdf["bytes_total"] / fdf["duration"].replace(0, 0.01).clip(0, 1e6)
            fdf["is_icmp"] = (fdf["protocol"] == "icmp").astype(int)
            fdf["short_duration"] = (fdf["duration"] < 0.05).astype(int)
            return fdf

        train_prep = _engineer(train_df)
        test_prep = _engineer(test_df)

        self.feature_names = [
            "duration", "src_bytes", "dst_bytes",
            "traffic_ratio", "bytes_total", "bytes_per_sec",
            "is_icmp", "short_duration",
            "protocol_enc", "service_enc",
        ]
        available = [f for f in self.feature_names if f in train_prep.columns]
        self.feature_names = available

        X_train = train_prep[self.feature_names].values
        y_train = train_prep["is_attack"].values
        X_test = test_prep[self.feature_names].values
        y_test = test_prep["is_attack"].values

        # ── Tuned RF (best from CV: max_depth=10-12, balanced) ──
        base = RandomForestClassifier(
            n_estimators=300, max_depth=15, min_samples_split=2,
            class_weight="balanced_subsample", random_state=42, n_jobs=-1,
        )
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        gscv = GridSearchCV(base, param_grid={"max_depth": [12, 15], "min_samples_split": [2, 5]}, cv=cv, scoring="roc_auc", n_jobs=-1)
        try:
            gscv.fit(X_train, y_train)
            self.rf = gscv.best_estimator_
            print(f"  CV best params: {gscv.best_params_}  CV AUC: {gscv.best_score_:.4f}")
        except Exception as e:
            print(f"  GridSearch failed ({e}), using tuned defaults")
            self.rf = base
            self.rf.fit(X_train, y_train)

        if not hasattr(self.rf, "feature_importances_"):
            self.rf.fit(X_train, y_train)

        y_pred_proba = self.rf.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_pred_proba)
        print(f"  Cyber Model — Hold-out AUC: {auc:.4f}")
        print(classification_report(y_test, (y_pred_proba > 0.5).astype(int), zero_division=0))

        save_path = model_save_path or str(BASE_DIR / "models" / "cyber.pkl")
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "wb") as f:
            pickle.dump({
                "model": self.rf,
                "feature_names": self.feature_names,
                "label_encoders": self.label_encoders,
                "attack_categories": self.attack_categories,
            }, f)
        print(f"  Saved to {save_path}")
        return {"auc": auc}

    def load(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.rf = data["model"]
        self.feature_names = data["feature_names"]
        self.label_encoders = data.get("label_encoders", {})
        self.attack_categories = data.get("attack_categories", [])

    def predict(self, features: dict) -> Dict:
        """Predict attack probability for a network event."""
        if self.rf is None:
            return self._fallback_predict(features)

        X = self._features_to_array(features)
        proba = float(self.rf.predict_proba(X)[0, 1])

        attack_types = self._identify_attack_types(features, proba)
        severity = self._calculate_severity(proba, features)

        return {
            "attack_probability": round(proba, 4),
            "attack_types": attack_types,
            "severity": severity,
            "score": round(proba * 100, 2),
            "indicators": self._get_indicators(features, proba),
        }

    def predict_batch(self, df: pd.DataFrame) -> np.ndarray:
        if self.rf is None:
            return np.full(len(df), 0.05)
        features_df = self._prepare_batch(df)
        X = features_df[self.feature_names].values
        return self.rf.predict_proba(X)[:, 1]

    # ── Internal helpers ──────────────────────────────────────────────

    def _prepare_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        features_df = df.copy()
        for col, le in self.label_encoders.items():
            if col in features_df.columns:
                features_df[col + "_enc"] = features_df[col].astype(str).map(
                    lambda x, _le=le: _le.transform([x])[0] if x in _le.classes_ else -1
                )
        features_df["traffic_ratio"] = (
            features_df["src_bytes"] / features_df["dst_bytes"].replace(0, 1)
        ).clip(0, 100)
        features_df["bytes_total"] = features_df["src_bytes"] + features_df["dst_bytes"]
        features_df["bytes_per_sec"] = features_df["bytes_total"] / features_df["duration"].replace(0, 0.01).clip(0, 1e6)
        features_df["is_icmp"] = (features_df.get("protocol", pd.Series("tcp")) == "icmp").astype(int) if "protocol" in features_df.columns else 0
        features_df["short_duration"] = (features_df["duration"] < 0.05).astype(int)
        return features_df

    def _features_to_array(self, features: dict) -> np.ndarray:
        row = {}
        for f in self.feature_names:
            if f == "protocol_enc":
                le = self.label_encoders.get("protocol")
                val = features.get("protocol", "tcp")
                row[f] = le.transform([val])[0] if le and val in le.classes_ else -1
            elif f == "service_enc":
                le = self.label_encoders.get("service")
                val = features.get("service", "http")
                row[f] = le.transform([val])[0] if le and val in le.classes_ else -1
            elif f == "traffic_ratio":
                row[f] = min(100, features.get("src_bytes", 0) / max(features.get("dst_bytes", 1), 1))
            elif f == "bytes_total":
                row[f] = features.get("src_bytes", 0) + features.get("dst_bytes", 0)
            elif f == "bytes_per_sec":
                row[f] = (features.get("src_bytes", 0) + features.get("dst_bytes", 0)) / max(features.get("duration", 0.01), 0.01)
            elif f == "is_icmp":
                row[f] = 1 if features.get("protocol") == "icmp" else 0
            elif f == "short_duration":
                row[f] = 1 if features.get("duration", 1) < 0.05 else 0
            else:
                row[f] = features.get(f, 0)
        return np.array([[row[f] for f in self.feature_names]])

    def _identify_attack_types(self, features: dict, proba: float) -> List[str]:
        types = []
        if proba > 0.3:
            if features.get("src_bytes", 0) > 5000:
                types.append("DoS")
            if features.get("duration", 0) < 0.1 and features.get("src_bytes", 0) > 1000:
                types.append("Exploits")
            if features.get("duration", 0) > 5:
                types.append("Reconnaissance")
            if not types:
                types.append("Generic")
        return types if types else ["Normal"]

    def _calculate_severity(self, proba: float, features: dict) -> str:
        if proba > 0.8:
            return "CRITICAL"
        elif proba > 0.6:
            return "HIGH"
        elif proba > 0.3:
            return "MODERATE"
        return "LOW"

    def _get_indicators(self, features: dict, proba: float) -> List[str]:
        indicators = []
        if features.get("src_bytes", 0) > 5000:
            indicators.append("high_outbound_traffic")
        if features.get("duration", 0) < 0.01:
            indicators.append("rapid_connection")
        if features.get("protocol", "") == "icmp":
            indicators.append("icmp_traffic")
        if proba > 0.5:
            indicators.append("ml_flagged")
        return indicators

    def _fallback_predict(self, features: dict) -> Dict:
        src = features.get("src_bytes", 0)
        duration = features.get("duration", 1)
        proba = min(0.95, 0.02 + (src / 10000) * 0.3 + (1 / max(duration, 0.01)) * 0.01)
        return {
            "attack_probability": round(proba, 4),
            "attack_types": ["Unknown"],
            "severity": self._calculate_severity(proba, features),
            "score": round(proba * 100, 2),
            "indicators": [],
        }
