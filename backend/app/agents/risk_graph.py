from langgraph.graph import StateGraph, START, END
from app.agents.state import RiskAssessmentState
from app.agents.nodes.data_quality import data_quality_node
from app.agents.nodes.financial_risk import financial_risk_node
from app.agents.nodes.customer_risk import customer_risk_node
from app.agents.nodes.fraud_risk import fraud_risk_node
from app.agents.nodes.operational_risk import operational_risk_node
from app.agents.nodes.cyber_risk import cyber_risk_node
from app.agents.nodes.risk_correlation import risk_correlation_node
from app.agents.nodes.risk_scoring import risk_scoring_node
from app.agents.nodes.risk_prediction import risk_prediction_node
from app.agents.nodes.root_cause import root_cause_node
from app.agents.nodes.impact_simulator import impact_simulator_node
from app.agents.nodes.mitigation import mitigation_node
from app.agents.nodes.policy_guardrail import policy_guardrail_node
from app.agents.nodes.outcome_monitor import outcome_monitor_node

builder = StateGraph(RiskAssessmentState)

builder.add_node("data_quality", data_quality_node)
builder.add_node("financial_risk", financial_risk_node)
builder.add_node("customer_risk", customer_risk_node)
builder.add_node("fraud_risk", fraud_risk_node)
builder.add_node("operational_risk", operational_risk_node)
builder.add_node("cyber_risk", cyber_risk_node)
builder.add_node("risk_correlation", risk_correlation_node)
builder.add_node("risk_scoring", risk_scoring_node)
builder.add_node("risk_prediction", risk_prediction_node)
builder.add_node("root_cause", root_cause_node)
builder.add_node("impact_simulator", impact_simulator_node)
builder.add_node("mitigation", mitigation_node)
builder.add_node("policy_guardrail", policy_guardrail_node)
builder.add_node("outcome_monitor", outcome_monitor_node)

builder.add_edge(START, "data_quality")
builder.add_edge("data_quality", "financial_risk")
builder.add_edge("data_quality", "customer_risk")
builder.add_edge("data_quality", "fraud_risk")
builder.add_edge("data_quality", "operational_risk")
builder.add_edge("data_quality", "cyber_risk")

builder.add_edge("financial_risk", "risk_correlation")
builder.add_edge("customer_risk", "risk_correlation")
builder.add_edge("fraud_risk", "risk_correlation")
builder.add_edge("operational_risk", "risk_correlation")
builder.add_edge("cyber_risk", "risk_correlation")

builder.add_edge("risk_correlation", "risk_scoring")
builder.add_edge("risk_scoring", "risk_prediction")
builder.add_edge("risk_prediction", "root_cause")
builder.add_edge("root_cause", "impact_simulator")
builder.add_edge("impact_simulator", "mitigation")
builder.add_edge("mitigation", "policy_guardrail")

def router(state: RiskAssessmentState):
    decision = state.get("policy_decision", {})
    if decision.get("approval_required"):
        return END # Needs human approval, stop pipeline
    return "outcome_monitor"

builder.add_conditional_edges("policy_guardrail", router)
builder.add_edge("outcome_monitor", END)

# Compile without checkpointer to avoid msgpack serialization issues with numpy types
risk_graph = builder.compile()
