"""Risk Correlation Agent Node — Detects cross-risk correlations from real agent outputs."""
from app.agents.state import RiskAssessmentState
from app.risk_engine.correlation import CorrelationEngine


def risk_correlation_node(state: RiskAssessmentState):
    """Analyze correlations across all risk domains using real scores from specialist agents."""
    engine = CorrelationEngine()

    # Extract real signals from all specialist agent outputs
    fin = state.get("financial_risk", {})
    cust = state.get("customer_risk", {})
    fraud = state.get("fraud_risk", {})
    ops = state.get("operational_risk", {})
    cyber = state.get("cyber_risk", {})

    # Build signal map from actual risk scores (normalized to 0-1)
    signals = {
        "receivables_up": min(1, fin.get("score", 0) / 100),
        "cash_down": min(1, fin.get("default_probability", 0)),
        "defaults_up": 1.0 if fin.get("risk_tier") in ("HIGH", "VERY_HIGH", "CRITICAL") else 0.0,
        "complaints": min(1, cust.get("churn_probability", 0)),
        "payment_failures": min(1, fin.get("score", 0) / 100),
        "usage_drop": 1.0 if cust.get("churn_probability", 0) > 0.5 else 0.0,
        "unusual_login": 1.0 if cyber.get("score", 0) > 50 else 0.0,
        "new_device": 0.5 if cyber.get("severity") in ("HIGH", "CRITICAL") else 0.0,
        "large_tx": 1.0 if fraud.get("anomaly_score", 0) > 0.5 else 0.0,
        "impossible_location": 1.0 if "unusual_location" in fraud.get("factors", []) else 0.0,
        "supplier_delay": min(1, ops.get("score", 0) / 100),
        "inventory_drop": 1.0 if ops.get("predicted_delay_days", 0) > 5 else 0.0,
        "order_delay": 1.0 if ops.get("sla_breach_prob", 0) > 0.5 else 0.0,
    }

    active = engine.detect_correlations(signals)
    score = engine.calculate_correlation_score(active)

    # Build correlation matrix between risk domains
    domain_scores = {
        "financial": fin.get("score", 0),
        "customer": cust.get("score", cust.get("churn_probability", 0) * 100),
        "fraud": fraud.get("fraud_score", fraud.get("fraud_probability", 0)) * 100 if fraud.get("fraud_score", 0) < 1 else fraud.get("fraud_score", 0),
        "operational": ops.get("score", 0),
        "cyber": cyber.get("score", 0),
    }

    matrix = {}
    domains = list(domain_scores.keys())
    for d1 in domains:
        matrix[d1] = {}
        for d2 in domains:
            if d1 == d2:
                matrix[d1][d2] = 1.0
            else:
                # Correlation strength based on co-elevation of scores
                s1 = domain_scores[d1] / 100
                s2 = domain_scores[d2] / 100
                matrix[d1][d2] = round(min(1, (s1 + s2) / 2 * 1.2), 2)

    # Total correlated exposure
    total_exposure = (
        fin.get("exposure", 0) +
        cust.get("revenue_exposure", 0) +
        ops.get("predicted_delay_days", 0) * 10000  # Estimate delay cost
    )

    return {
        "correlations": {
            "matrix": matrix,
            "score": score,
            "cascades": [c.name for c in active],
            "domain_scores": domain_scores,
            "exposure": round(total_exposure, 2),
            "active_patterns": len(active),
        },
        "audit_trail": [
            f"Correlations: score={score:.1f}, active_patterns={len(active)}, "
            f"cascades={[c.name for c in active]}"
        ],
    }
