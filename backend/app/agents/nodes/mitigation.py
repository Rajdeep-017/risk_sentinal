"""Mitigation Agent Node — Generates contextual mitigations based on actual risk drivers."""
from app.agents.state import RiskAssessmentState


# Mitigation playbook: maps risk drivers to recommended actions
MITIGATION_PLAYBOOK = {
    # Financial mitigations
    "payment_delay_days": {
        "action": "Accelerate collections on overdue accounts",
        "expected_impact": "Reduce outstanding receivables by 15-20%",
        "confidence": 0.88,
        "category": "financial",
    },
    "utilization_ratio": {
        "action": "Review and adjust credit limits for high-utilization accounts",
        "expected_impact": "Reduce default risk by ~12%",
        "confidence": 0.82,
        "category": "financial",
    },
    "balance": {
        "action": "Implement proactive payment reminders and structured repayment plans",
        "expected_impact": "Improve payment rates by 10-15%",
        "confidence": 0.85,
        "category": "financial",
    },
    # Customer mitigations
    "short_tenure": {
        "action": "Deploy targeted onboarding program for new customers",
        "expected_impact": "Reduce early churn by 25%",
        "confidence": 0.78,
        "category": "customer",
    },
    "high_charges": {
        "action": "Offer loyalty discount or plan optimization",
        "expected_impact": "Reduce churn probability by 18%",
        "confidence": 0.80,
        "category": "customer",
    },
    "month_to_month_contract": {
        "action": "Incentivize annual contract migration with 10% discount",
        "expected_impact": "Reduce churn risk by 35%",
        "confidence": 0.90,
        "category": "customer",
    },
    "high_churn_risk": {
        "action": "Assign dedicated account manager for proactive retention",
        "expected_impact": "Reduce churn probability by 20-30%",
        "confidence": 0.85,
        "category": "customer",
    },
    # Fraud mitigations
    "velocity_spike": {
        "action": "Implement step-up authentication for velocity anomalies",
        "expected_impact": "Block 90% of velocity-based fraud",
        "confidence": 0.92,
        "category": "fraud",
    },
    "unusual_location": {
        "action": "Require OTP verification for transactions from new locations",
        "expected_impact": "Reduce location-based fraud by 85%",
        "confidence": 0.91,
        "category": "fraud",
    },
    "high_value_transaction": {
        "action": "Apply enhanced due diligence for high-value transactions",
        "expected_impact": "Reduce high-value fraud losses by 40%",
        "confidence": 0.87,
        "category": "fraud",
    },
    "statistical_anomaly": {
        "action": "Flag for manual review and temporary hold",
        "expected_impact": "Prevent estimated INR 2-5L in fraud losses",
        "confidence": 0.84,
        "category": "fraud",
    },
    # Operational mitigations
    "SLA breach risk": {
        "action": "Activate backup supplier and renegotiate delivery terms",
        "expected_impact": "Reduce delivery delays by 60%",
        "confidence": 0.86,
        "category": "operational",
    },
    "Predicted delivery delay": {
        "action": "Proactively notify affected customers and offer alternatives",
        "expected_impact": "Maintain customer satisfaction despite delays",
        "confidence": 0.83,
        "category": "operational",
    },
    # Cyber mitigations
    "high_outbound_traffic": {
        "action": "Isolate affected network segment and investigate data exfiltration",
        "expected_impact": "Prevent potential data breach",
        "confidence": 0.90,
        "category": "cyber",
    },
    "ml_flagged": {
        "action": "Initiate incident response protocol and forensic analysis",
        "expected_impact": "Contain threat within 4 hours",
        "confidence": 0.88,
        "category": "cyber",
    },
    # Cross-risk mitigations
    "Cross-risk cascade": {
        "action": "Convene cross-functional risk committee for coordinated response",
        "expected_impact": "Reduce cascading impact by 30-50%",
        "confidence": 0.75,
        "category": "enterprise",
    },
}


def mitigation_node(state: RiskAssessmentState):
    """Generate contextual mitigations based on actual risk drivers and root causes."""
    root_causes = state.get("root_causes", [])
    risk_level = state.get("risk_level", "MODERATE")
    composite_score = state.get("composite_score", 50.0)

    # Also collect signals from all risk domains
    cust = state.get("customer_risk", {})
    fraud = state.get("fraud_risk", {})
    ops = state.get("operational_risk", {})
    cyber = state.get("cyber_risk", {})

    all_signals = set(root_causes)
    all_signals.update(cust.get("signals", []))
    all_signals.update(fraud.get("factors", []))
    all_signals.update([a.split(":")[0] for a in ops.get("supplier_alerts", [])])
    all_signals.update(cyber.get("indicators", []))

    # Remove generic/normal signals
    all_signals -= {"normal_behavior", "normal_pattern", "Normal"}

    mitigations = []
    seen_actions = set()

    for signal in all_signals:
        # Look up in playbook (try exact match, then prefix match)
        playbook_entry = MITIGATION_PLAYBOOK.get(signal)
        if playbook_entry is None:
            # Try prefix match
            for key, entry in MITIGATION_PLAYBOOK.items():
                if key in signal or signal.startswith(key):
                    playbook_entry = entry
                    break

        if playbook_entry and playbook_entry["action"] not in seen_actions:
            mitigations.append({
                "action": playbook_entry["action"],
                "expected_impact": playbook_entry["expected_impact"],
                "confidence": playbook_entry["confidence"],
                "category": playbook_entry["category"],
                "trigger": signal,
                "priority": "HIGH" if composite_score > 70 else ("MEDIUM" if composite_score > 40 else "LOW"),
            })
            seen_actions.add(playbook_entry["action"])

    # If no specific mitigations found, add general recommendations
    if not mitigations:
        mitigations = [{
            "action": "Continue standard monitoring procedures",
            "expected_impact": "Maintain current risk posture",
            "confidence": 0.95,
            "category": "general",
            "trigger": "routine",
            "priority": "LOW",
        }]

    # Sort by confidence (highest first)
    mitigations.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "mitigations": mitigations[:10],  # Top 10 mitigations
        "audit_trail": [
            f"Generated {len(mitigations)} mitigations for {len(all_signals)} risk signals. "
            f"Top action: {mitigations[0]['action'][:60]}..."
        ],
    }
