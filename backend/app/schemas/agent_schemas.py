from pydantic import BaseModel
from typing import List, Dict, Optional

class DataQualityReport(BaseModel):
    score: float
    warnings: List[str]

class FinancialRiskResult(BaseModel):
    score: float
    drivers: List[str]
    exposure: float

class CustomerRiskResult(BaseModel):
    churn_probability: float
    signals: List[str]
    revenue_exposure: float

class FraudRiskResult(BaseModel):
    fraud_probability: float
    anomaly_score: float
    factors: List[str]

class OperationalRiskResult(BaseModel):
    score: float
    supplier_alerts: List[str]
    stockout_predictions: List[str]

class CyberRiskResult(BaseModel):
    score: float
    attack_types: List[str]
    severity: str

class CorrelationResult(BaseModel):
    matrix: Dict[str, Dict[str, float]]
    cascades: List[str]
    exposure: float

class MitigationAction(BaseModel):
    action: str
    expected_impact: str
    confidence: float

class PolicyDecision(BaseModel):
    approved: bool
    approval_required: bool
    reason: str
