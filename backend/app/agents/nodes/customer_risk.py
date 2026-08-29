"""Customer Risk Agent Node — Uses LightGBM churn model for customer risk assessment."""
from app.agents.state import RiskAssessmentState
from app.ml.registry import registry


def customer_risk_node(state: RiskAssessmentState):
    """Assess customer churn risk using the trained LightGBM model."""
    input_data = state.get("input_data", {})
    customer_data = input_data.get("customer", {})

    # Run churn model
    result = registry.predict("churn", customer_data)

    churn_prob = result.get("churn_probability", 0.2)
    signals = result.get("risk_signals", ["normal_behavior"])
    revenue_exposure = result.get("revenue_exposure", 5000.0)

    return {
        "customer_risk": {
            "churn_probability": churn_prob,
            "score": result.get("score", churn_prob * 100),
            "signals": signals,
            "revenue_exposure": revenue_exposure,
            "top_drivers": result.get("top_shap_features", ["tenure_months"]),
        },
        "audit_trail": [
            f"Customer risk: churn_prob={churn_prob:.2%}, signals={signals[:3]}, "
            f"exposure=INR {revenue_exposure:,.0f}"
        ],
    }
