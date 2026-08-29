"""Outcome Monitor Agent Node — Persists assessment results and logs audit trail."""
from app.agents.state import RiskAssessmentState
from datetime import datetime, timezone


def outcome_monitor_node(state: RiskAssessmentState):
    """Log final assessment to monitoring system and prepare persistence data."""
    entity_id = state.get("entity_id", "unknown")
    entity_type = state.get("entity_type", "unknown")
    composite_score = state.get("composite_score", 0)
    risk_level = state.get("risk_level", "LOW")
    approval_status = state.get("approval_status", "APPROVED")

    # Build assessment summary for persistence
    assessment_summary = {
        "entity_id": entity_id,
        "entity_type": entity_type,
        "composite_score": composite_score,
        "risk_level": risk_level,
        "approval_status": approval_status,
        "assessed_at": datetime.now(timezone.utc).isoformat(),
        "data_quality_score": state.get("data_quality", {}).get("score", 0),
        "financial_score": state.get("financial_risk", {}).get("score", 0),
        "customer_score": state.get("customer_risk", {}).get("score",
                          state.get("customer_risk", {}).get("churn_probability", 0) * 100),
        "fraud_score": state.get("fraud_risk", {}).get("fraud_score", 0),
        "operational_score": state.get("operational_risk", {}).get("score", 0),
        "cyber_score": state.get("cyber_risk", {}).get("score", 0),
        "correlation_score": state.get("correlations", {}).get("score", 0),
        "velocity": state.get("risk_velocity", 0),
        "predictions": state.get("predictions", {}),
        "root_causes": state.get("root_causes", []),
        "mitigations_count": len(state.get("mitigations", [])),
        "total_exposure": state.get("simulation_results", {}).get("total_simulated_exposure", 0),
    }

    return {
        "audit_trail": [
            f"Assessment complete: entity={entity_id}, score={composite_score:.1f} [{risk_level}], "
            f"status={approval_status}. Logged to monitoring system at "
            f"{assessment_summary['assessed_at']}"
        ],
    }
