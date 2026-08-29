"""Operational Risk Agent Node — Uses XGBoost for supply chain risk assessment."""
from app.agents.state import RiskAssessmentState
from app.ml.registry import registry


def operational_risk_node(state: RiskAssessmentState):
    """Assess operational/supply chain risk using trained models."""
    input_data = state.get("input_data", {})
    op_data = input_data.get("operational", {})

    # Run operational model
    result = registry.predict("operational", op_data)

    score = result.get("score", 30.0)
    alerts = result.get("supplier_alerts", [])
    stockout = result.get("stockout_predictions", [])

    return {
        "operational_risk": {
            "score": score,
            "supplier_reliability": result.get("supplier_reliability", 0.85),
            "predicted_delay_days": result.get("predicted_delay_days", 0),
            "sla_breach_prob": result.get("sla_breach_prob", 0.1),
            "supplier_alerts": alerts,
            "stockout_predictions": stockout,
        },
        "audit_trail": [
            f"Operational risk: score={score:.1f}, "
            f"delay={result.get('predicted_delay_days', 0):.1f}d, "
            f"SLA breach={result.get('sla_breach_prob', 0):.0%}"
        ],
    }
