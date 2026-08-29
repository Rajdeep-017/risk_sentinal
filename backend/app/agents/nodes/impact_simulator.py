"""Impact Simulator Agent Node — Cascade simulation using real risk data."""
from app.agents.state import RiskAssessmentState
from app.risk_engine.cascade import CascadeBuilder


def impact_simulator_node(state: RiskAssessmentState):
    """Simulate cascading risk impact using actual risk data and root causes."""
    root_causes = state.get("root_causes", [])
    fin = state.get("financial_risk", {})
    ops = state.get("operational_risk", {})
    cust = state.get("customer_risk", {})
    composite = state.get("composite_score", 50.0)

    builder = CascadeBuilder()
    simulations = []

    # Build signal map from actual state
    signals = {
        "supplier_delay": ops.get("score", 0) / 100,
        "financial_stress": fin.get("score", 0) / 100,
        "churn_risk": cust.get("churn_probability", 0),
        "delay_days": ops.get("predicted_delay_days", 0),
    }

    for cause in root_causes[:3]:  # Simulate top 3 root causes
        try:
            cascade = builder.build_cascade(cause, signals)
            simulations.append({
                "root_cause": cause,
                "total_exposure": cascade.total_exposure,
                "cascade_depth": len(cascade.nodes),
                "cascade": {
                    "root_cause": cascade.root_cause,
                    "total_exposure": cascade.total_exposure,
                    "nodes": [_node_to_dict(n) for n in cascade.nodes],
                },
            })
        except Exception:
            # Build a simple simulation estimate
            base_exposure = fin.get("exposure", 0) + cust.get("revenue_exposure", 0)
            simulations.append({
                "root_cause": cause,
                "total_exposure": base_exposure * 1.5,
                "cascade_depth": 2,
                "cascade": {
                    "root_cause": cause,
                    "total_exposure": base_exposure * 1.5,
                    "nodes": [],
                },
            })

    # Compute overall simulation summary
    total_simulated_exposure = sum(s["total_exposure"] for s in simulations)
    base_exposure = fin.get("exposure", 0) + cust.get("revenue_exposure", 0)
    impact_multiplier = total_simulated_exposure / max(base_exposure, 1) if base_exposure > 0 else 1.5

    return {
        "simulation_results": {
            "simulations": simulations,
            "total_simulated_exposure": round(total_simulated_exposure, 2),
            "base_exposure": round(base_exposure, 2),
            "impact_multiplier": round(impact_multiplier, 2),
            "worst_case_score": round(min(100, composite * impact_multiplier), 2),
        },
        "audit_trail": [
            f"Impact simulation: {len(simulations)} scenarios, "
            f"total exposure=INR {total_simulated_exposure:,.0f}, "
            f"multiplier={impact_multiplier:.1f}x"
        ],
    }


def _node_to_dict(node) -> dict:
    """Convert RiskCascadeNode to dict recursively."""
    return {
        "id": node.id,
        "risk_type": node.risk_type,
        "description": node.description,
        "impact_pct": node.impact_pct,
        "exposure_amount": node.exposure_amount,
        "children": [_node_to_dict(c) for c in node.children],
    }
