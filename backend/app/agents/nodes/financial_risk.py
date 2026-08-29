"""Financial Risk Agent Node — Uses XGBoost credit risk model for default prediction."""
from app.agents.state import RiskAssessmentState
from app.ml.registry import registry


def financial_risk_node(state: RiskAssessmentState):
    """Assess financial/credit risk using the trained XGBoost model."""
    input_data = state.get("input_data", {})
    credit_data = input_data.get("credit", {})

    # Run credit risk model
    result = registry.predict("credit", credit_data)

    score = result.get("score", 45.0)
    drivers = result.get("top_shap_features", ["payment_delay_days", "utilization_ratio"])
    exposure = result.get("exposure", credit_data.get("balance", 0) + credit_data.get("bill_amount", 0))

    return {
        "financial_risk": {
            "score": score,
            "default_probability": result.get("default_probability", score / 100),
            "risk_tier": result.get("risk_tier", "MODERATE"),
            "drivers": drivers,
            "exposure": float(exposure),
        },
        "audit_trail": [
            f"Financial risk: score={score:.1f}, tier={result.get('risk_tier', 'MODERATE')}, "
            f"drivers={drivers[:3]}"
        ],
    }
