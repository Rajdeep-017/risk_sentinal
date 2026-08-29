"""Root Cause Agent Node — Analyzes risk components to identify actual top drivers."""
from app.agents.state import RiskAssessmentState


def root_cause_node(state: RiskAssessmentState):
    """Identify root causes by analyzing contributions from all risk domains."""
    fin = state.get("financial_risk", {})
    cust = state.get("customer_risk", {})
    fraud = state.get("fraud_risk", {})
    ops = state.get("operational_risk", {})
    cyber = state.get("cyber_risk", {})
    corr = state.get("correlations", {})

    # Collect all risk drivers with their scores
    cause_candidates = []

    # Financial drivers
    for driver in fin.get("drivers", []):
        cause_candidates.append({
            "cause": driver,
            "domain": "financial",
            "contribution": fin.get("score", 0),
            "evidence": f"Financial score: {fin.get('score', 0):.1f}, "
                        f"default prob: {fin.get('default_probability', 0):.2%}",
        })

    # Customer drivers
    for signal in cust.get("signals", []):
        if signal != "normal_behavior":
            cause_candidates.append({
                "cause": signal,
                "domain": "customer",
                "contribution": cust.get("score", cust.get("churn_probability", 0) * 100),
                "evidence": f"Churn probability: {cust.get('churn_probability', 0):.2%}, "
                            f"exposure: INR {cust.get('revenue_exposure', 0):,.0f}",
            })

    # Fraud drivers
    for factor in fraud.get("factors", []):
        if factor != "normal_pattern":
            cause_candidates.append({
                "cause": factor,
                "domain": "fraud",
                "contribution": fraud.get("fraud_score", fraud.get("fraud_probability", 0)) * 100 if fraud.get("fraud_score", 0) < 1 else fraud.get("fraud_score", 0),
                "evidence": f"Fraud score: {fraud.get('fraud_score', 0):.4f}, "
                            f"anomaly: {fraud.get('anomaly_score', 0):.2f}",
            })

    # Operational drivers
    for alert in ops.get("supplier_alerts", []):
        cause_candidates.append({
            "cause": alert,
            "domain": "operational",
            "contribution": ops.get("score", 0),
            "evidence": f"Operational score: {ops.get('score', 0):.1f}, "
                        f"delay: {ops.get('predicted_delay_days', 0):.1f}d",
        })
    if ops.get("sla_breach_prob", 0) > 0.3:
        cause_candidates.append({
            "cause": "SLA breach risk",
            "domain": "operational",
            "contribution": ops.get("score", 0),
            "evidence": f"SLA breach probability: {ops.get('sla_breach_prob', 0):.0%}",
        })

    # Cyber drivers
    for indicator in cyber.get("indicators", []):
        cause_candidates.append({
            "cause": indicator,
            "domain": "cyber",
            "contribution": cyber.get("score", 0),
            "evidence": f"Cyber score: {cyber.get('score', 0):.1f}, "
                        f"severity: {cyber.get('severity', 'LOW')}",
        })

    # Correlation-derived drivers
    for cascade in corr.get("cascades", []):
        cause_candidates.append({
            "cause": f"Cross-risk cascade: {cascade}",
            "domain": "correlation",
            "contribution": corr.get("score", 0),
            "evidence": f"Correlation score: {corr.get('score', 0):.1f}",
        })

    # Sort by contribution and take top causes
    cause_candidates.sort(key=lambda x: x["contribution"], reverse=True)
    top_causes = cause_candidates[:10]

    # Simple list for backward compatibility
    root_cause_list = [c["cause"] for c in top_causes] if top_causes else ["No significant risk drivers identified"]

    return {
        "root_causes": root_cause_list,
        "audit_trail": [
            f"Root cause analysis: {len(top_causes)} drivers identified. "
            f"Top: {root_cause_list[:3]}"
        ],
    }
