from typing import TypedDict, Annotated
import operator

class RiskAssessmentState(TypedDict):
    messages: Annotated[list, operator.add]
    entity_id: str
    entity_type: str
    input_data: dict
    data_quality: dict
    financial_risk: dict
    customer_risk: dict  
    fraud_risk: dict
    operational_risk: dict
    cyber_risk: dict
    correlations: dict
    composite_score: float
    risk_level: str
    risk_velocity: float
    predictions: dict
    root_causes: list
    simulation_results: dict
    mitigations: list
    policy_decision: dict
    approval_status: str
    audit_trail: Annotated[list, operator.add]
