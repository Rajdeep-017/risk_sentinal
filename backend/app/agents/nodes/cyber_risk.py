"""Cyber Risk Agent Node — Uses RandomForest for network threat detection."""
from app.agents.state import RiskAssessmentState
from app.ml.registry import registry


def cyber_risk_node(state: RiskAssessmentState):
    """Assess cyber risk using the trained RandomForest model."""
    input_data = state.get("input_data", {})
    cyber_data = input_data.get("cyber", {})

    # Run cyber model
    result = registry.predict("cyber", cyber_data)

    score = result.get("score", 10.0)
    attack_types = result.get("attack_types", ["Normal"])
    severity = result.get("severity", "LOW")

    return {
        "cyber_risk": {
            "score": score,
            "attack_probability": result.get("attack_probability", score / 100),
            "attack_types": attack_types,
            "severity": severity,
            "indicators": result.get("indicators", []),
        },
        "audit_trail": [
            f"Cyber risk: score={score:.1f}, severity={severity}, "
            f"attack_types={attack_types}"
        ],
    }
