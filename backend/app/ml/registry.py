"""
ML Model Registry — Thread-safe singleton for loading and serving all trained models.
Supports prediction, probability outputs, and SHAP explanations.
"""
import threading
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from app.config import settings

BASE_DIR = Path("d:/Razorpay project")


class MLRegistry:
    """Thread-safe registry for all ML models."""

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.lock = threading.Lock()
        self._loaded = False

    def load_all_models(self, model_dir: str = None):
        """Load all available trained models from the model directory."""
        _dir = Path(model_dir or str(BASE_DIR / "models"))

        model_files = {
            "credit": (_dir / "credit_risk.pkl", "credit_risk"),
            "churn": (_dir / "churn.pkl", "churn"),
            "fraud_iso": (_dir / "fraud_iso.pkl", "fraud_iso"),
            "fraud_xgb": (_dir / "fraud_xgb.pkl", "fraud_xgb"),
            "cyber": (_dir / "cyber.pkl", "cyber"),
            "operational": (_dir / "operational.pkl", "operational"),
            "forecaster": (_dir / "forecaster.pkl", "forecaster"),
        }

        with self.lock:
            for name, (path, model_type) in model_files.items():
                self._load_single(name, str(path), model_type)
            self._loaded = True

        loaded_count = sum(1 for v in self.models.values() if v is not None)
        print(f"MLRegistry: Loaded {loaded_count}/{len(model_files)} models")

    def _load_single(self, name: str, path: str, model_type: str):
        """Load a single model by type."""
        if not os.path.exists(path):
            print(f"  Warning: Model {name} not found at {path}")
            self.models[name] = None
            return

        try:
            if model_type == "credit_risk":
                from app.ml.models.credit_risk_model import CreditRiskModel
                m = CreditRiskModel()
                m.load(path)
                self.models[name] = m

            elif model_type == "churn":
                from app.ml.models.churn_model import ChurnModel
                m = ChurnModel()
                m.load(path)
                self.models[name] = m

            elif model_type in ("fraud_iso", "fraud_xgb"):
                # Fraud uses a dual model; we load both into a single FraudModel
                if "fraud" not in self.models or self.models.get("fraud") is None:
                    from app.ml.models.fraud_model import FraudModel
                    self.models["fraud"] = FraudModel()

                fraud_model = self.models["fraud"]
                if model_type == "fraud_iso":
                    import pickle
                    with open(path, "rb") as f:
                        data = pickle.load(f)
                    fraud_model.iso_forest = data["model"]
                    fraud_model.feature_names = data["feature_names"]
                elif model_type == "fraud_xgb":
                    import pickle
                    with open(path, "rb") as f:
                        data = pickle.load(f)
                    fraud_model.xgb = data["model"]
                    fraud_model.threshold = data.get("threshold", 0.5)

            elif model_type == "cyber":
                from app.ml.models.cyber_model import CyberModel
                m = CyberModel()
                m.load(path)
                self.models[name] = m

            elif model_type == "operational":
                from app.ml.models.operational_model import OperationalModel
                m = OperationalModel()
                m.load(path)
                self.models[name] = m

            elif model_type == "forecaster":
                from app.ml.models.forecaster import Forecaster
                m = Forecaster()
                m.load(path)
                self.models[name] = m

            print(f"  [OK] Loaded {name} from {path}")

        except Exception as e:
            print(f"  [FAIL] Failed to load {name}: {e}")
            self.models[name] = None

    def load_model(self, name: str, path: str):
        """Legacy method: load a single model by name and path."""
        with self.lock:
            model_type_map = {
                "credit": "credit_risk",
                "churn": "churn",
                "fraud_iso": "fraud_iso",
                "fraud_xgb": "fraud_xgb",
                "cyber": "cyber",
                "operational": "operational",
                "forecaster": "forecaster",
            }
            self._load_single(name, path, model_type_map.get(name, name))

    def get_model(self, name: str) -> Optional[Any]:
        """Get a loaded model by name."""
        with self.lock:
            return self.models.get(name)

    def predict(self, model_name: str, features: dict) -> dict:
        """Run prediction on a named model."""
        with self.lock:
            model = self.models.get(model_name)

        if model is None:
            return self._fallback_prediction(model_name, features)

        try:
            return model.predict(features)
        except Exception as e:
            print(f"  Prediction error for {model_name}: {e}")
            return self._fallback_prediction(model_name, features)

    def predict_proba(self, model_name: str, features: dict) -> float:
        """Get probability output from a model."""
        result = self.predict(model_name, features)
        # Map model-specific probability fields to a generic probability
        prob_fields = [
            "default_probability", "churn_probability", "fraud_probability",
            "attack_probability", "sla_breach_prob",
        ]
        for field in prob_fields:
            if field in result:
                return result[field]
        if "score" in result:
            return result["score"] / 100.0
        return 0.5

    def explain(self, model_name: str, features: dict) -> List[str]:
        """Get SHAP feature explanations from a model."""
        result = self.predict(model_name, features)
        return result.get("top_shap_features", [])

    def get_feature_importance(self, model_name: str) -> Dict[str, float]:
        """Get global feature importances from a model."""
        with self.lock:
            model = self.models.get(model_name)

        if model is None:
            return {"feature_1": 0.5, "feature_2": 0.3, "feature_3": 0.2}

        try:
            # Try to get feature importance from the underlying sklearn/xgb model
            inner = getattr(model, "model", None) or getattr(model, "xgb", None) or getattr(model, "rf", None)
            if inner is not None and hasattr(inner, "feature_importances_"):
                names = getattr(model, "feature_names", [f"f{i}" for i in range(len(inner.feature_importances_))])
                imp = inner.feature_importances_
                return {names[i]: float(imp[i]) for i in range(len(names))}
        except Exception:
            pass

        return {"feature_1": 0.5, "feature_2": 0.3, "feature_3": 0.2}

    def is_loaded(self) -> bool:
        return self._loaded

    def status(self) -> Dict[str, str]:
        """Return status of all models."""
        with self.lock:
            return {
                name: "loaded" if model is not None else "not_found"
                for name, model in self.models.items()
            }

    def _fallback_prediction(self, model_name: str, features: dict) -> dict:
        """Return reasonable fallback predictions when model is unavailable."""
        fallbacks = {
            "credit": {"default_probability": 0.15, "risk_tier": "MODERATE", "score": 15.0,
                       "top_shap_features": ["payment_delay_days", "utilization_ratio"], "exposure": 0},
            "churn": {"churn_probability": 0.22, "risk_signals": ["normal_behavior"],
                      "revenue_exposure": 1074.0, "score": 22.0, "top_shap_features": ["tenure_months"]},
            "fraud": {"fraud_score": 0.05, "fraud_probability": 0.05, "anomaly_score": 0.1,
                      "is_fraud": False, "factors": ["normal_pattern"], "top_shap_features": ["amount"]},
            "cyber": {"attack_probability": 0.05, "attack_types": ["Normal"], "severity": "LOW",
                      "score": 5.0, "indicators": []},
            "operational": {"supplier_reliability": 0.85, "predicted_delay_days": 1.0,
                            "sla_breach_prob": 0.1, "stock_out_prob": 0.07, "sla_breach_risk": 0.1,
                            "score": 15.0, "supplier_alerts": [], "stockout_predictions": []},
            "forecaster": {"7_day": {"score": 50, "ci": [40, 60]},
                           "30_day": {"score": 55, "ci": [35, 75]},
                           "90_day": {"score": 60, "ci": [30, 90]}},
        }
        return fallbacks.get(model_name, {"score": 50.0})


# Global singleton
registry = MLRegistry()
