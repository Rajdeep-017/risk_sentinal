"""Policy Guardrail Agent Node — Checks mitigations against policy thresholds."""
from app.agents.state import RiskAssessmentState


# Policy rules: what requires human approval at each risk level
POLICY_RULES = {
    "LOW": {
        "auto_approve": True,
        "max_auto_exposure": 50000,
        "escalation_required": False,
    },
    "MODERATE": {
        "auto_approve": True,
        "max_auto_exposure": 200000,
        "escalation_required": False,
    },
    "HIGH": {
        "auto_approve": False,
        "max_auto_exposure": 0,
        "escalation_required": True,
        "approval_authority": "VP / SVP",
    },
    "VERY_HIGH": {
        "auto_approve": False,
        "max_auto_exposure": 0,
        "escalation_required": True,
        "approval_authority": "C-Suite",
    },
    "CRITICAL": {
        "auto_approve": False,
        "max_auto_exposure": 0,
        "escalation_required": True,
        "approval_authority": "Board of Directors",
    },
}


def policy_guardrail_node(state: RiskAssessmentState):
    """Check risk level and mitigations against policy rules for approval routing."""
    level = state.get("risk_level", "LOW")
    composite_score = state.get("composite_score", 0)
    mitigations = state.get("mitigations", [])
    simulation = state.get("simulation_results", {})

    policy = POLICY_RULES.get(level, POLICY_RULES["LOW"])

    # Check if any mitigation exceeds auto-approve exposure threshold
    total_exposure = simulation.get("total_simulated_exposure", 0)
    exposure_exceeds = total_exposure > policy["max_auto_exposure"]

    # Check for high-impact mitigations that need review
    high_impact_actions = [
        m for m in mitigations
        if m.get("category") in ("fraud", "cyber", "enterprise")
        and m.get("priority") == "HIGH"
    ]

    approval_required = (
        not policy["auto_approve"] or
        exposure_exceeds or
        len(high_impact_actions) > 0
    )

    # Build decision record
    reasons = []
    if not policy["auto_approve"]:
        reasons.append(f"Risk level {level} requires manual approval")
    if exposure_exceeds:
        reasons.append(f"Exposure INR {total_exposure:,.0f} exceeds auto-approve limit INR {policy['max_auto_exposure']:,.0f}")
    if high_impact_actions:
        reasons.append(f"{len(high_impact_actions)} high-impact actions require review")
    if not reasons:
        reasons.append(f"Risk level {level} within auto-approve threshold")

    decision = {
        "approved": not approval_required,
        "approval_required": approval_required,
        "risk_level": level,
        "composite_score": composite_score,
        "reason": "; ".join(reasons),
        "approval_authority": policy.get("approval_authority", "Auto-approved"),
        "escalation_required": policy.get("escalation_required", False),
        "policy_violations": [],
        "mitigations_count": len(mitigations),
        "high_impact_actions": len(high_impact_actions),
    }

    approval_status = "APPROVED" if not approval_required else "PENDING_APPROVAL"

    return {
        "policy_decision": decision,
        "approval_status": approval_status,
        "audit_trail": [
            f"Policy check: {approval_status} (level={level}, score={composite_score:.1f}, "
            f"exposure=INR {total_exposure:,.0f}). Reason: {reasons[0]}"
        ],
    }
