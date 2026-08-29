"""Risk Scoring Agent Node — Computes composite risk score from real ML outputs."""
from app.agents.state import RiskAssessmentState
from app.risk_engine.scoring import calculate_risk_score, get_risk_level
from app.risk_engine.velocity import calculate_velocity
from datetime import datetime, timezone


def risk_scoring_node(state: RiskAssessmentState):
    """Calculate the weighted composite risk score using real agent outputs."""
    fin = state.get("financial_risk", {})
    cust = state.get("customer_risk", {})
    fraud = state.get("fraud_risk", {})
    ops = state.get("operational_risk", {})
    cyber = state.get("cyber_risk", {})
    corr = state.get("correlations", {})

    # ML Probability: weighted average of all specialist scores
    ml_scores = {
        "financial": fin.get("score", 0),
        "customer": cust.get("score", cust.get("churn_probability", 0) * 100),
        "fraud": fraud.get("fraud_score", fraud.get("fraud_probability", 0)) * 100 if fraud.get("fraud_score", 0) < 1 else fraud.get("fraud_score", 0),
        "operational": ops.get("score", 0),
        "cyber": cyber.get("score", 0),
    }
    weights = {"financial": 0.30, "fraud": 0.25, "cyber": 0.20, "operational": 0.15, "customer": 0.10}
    ml_prob = sum(ml_scores.get(k, 0) * w for k, w in weights.items())

    # Anomaly score from fraud detection
    anomaly = fraud.get("anomaly_score", 0) * 100

    # Trend score: higher if multiple domains are elevated
    elevated = sum(1 for v in ml_scores.values() if v > 50)
    trend = min(100, elevated * 20 + 10)

    # Exposure (normalized 0-100)
    total_exposure = (
        fin.get("exposure", 0) +
        cust.get("revenue_exposure", 0) +
        ops.get("predicted_delay_days", 0) * 10000
    )
    exposure = min(100, total_exposure / 50000 * 100) if total_exposure > 0 else 20

    # Business criticality (based on risk tier combinations)
    criticality_map = {"CRITICAL": 100, "HIGH": 75, "VERY_HIGH": 85, "MODERATE": 40, "LOW": 15}
    fin_tier = fin.get("risk_tier", "MODERATE")
    criticality = criticality_map.get(fin_tier, 40)

    # Correlation score
    correlation = corr.get("score", 0)

    # Compute final composite score
    score = calculate_risk_score(ml_prob, anomaly, trend, exposure, criticality, correlation)
    level = get_risk_level(score)

    # Calculate velocity if we have historical data
    velocity = 0.0
    try:
        history = [(datetime.now(timezone.utc), score)]
        velocity = calculate_velocity(history)
    except Exception:
        pass

    return {
        "composite_score": round(score, 2),
        "risk_level": level,
        "risk_velocity": round(velocity, 4),
        "audit_trail": [
            f"Composite score: {score:.1f}/100 [{level}] "
            f"(ml={ml_prob:.1f}, anomaly={anomaly:.1f}, trend={trend:.0f}, "
            f"exposure={exposure:.0f}, criticality={criticality:.0f}, corr={correlation:.1f})"
        ],
    }
