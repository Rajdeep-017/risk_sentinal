"""Fraud Risk Agent Node — Uses IsolationForest + XGBoost for fraud detection."""
from app.agents.state import RiskAssessmentState
from app.ml.registry import registry


def fraud_risk_node(state: RiskAssessmentState):
    """Detect fraud using dual model (anomaly + classification)."""
    input_data = state.get("input_data", {})
    fraud_data = input_data.get("fraud", {})

    # Run fraud model (dual: IsolationForest + XGBoost)
    result = registry.predict("fraud", fraud_data)

    fraud_prob = result.get("fraud_probability", 0.05)
    anomaly_score = result.get("anomaly_score", 0.1)
    factors = result.get("factors", [])

    return {
        "fraud_risk": {
            "fraud_probability": fraud_prob,
            "anomaly_score": anomaly_score,
            "fraud_score": result.get("fraud_score", fraud_prob),
            "is_fraud": result.get("is_fraud", False),
            "factors": factors,
            "top_drivers": result.get("top_shap_features", ["amount"]),
        },
        "audit_trail": [
            f"Fraud risk: prob={fraud_prob:.2%}, anomaly={anomaly_score:.2f}, "
            f"factors={factors[:3]}"
        ],
    }
