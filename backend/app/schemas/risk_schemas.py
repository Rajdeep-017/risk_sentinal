from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime

class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"
    CRITICAL = "CRITICAL"

class RiskScore(BaseModel):
    value: float
    level: RiskLevel
    trend: str

class RiskPrediction(BaseModel):
    horizon_days: int
    predicted_score: float
    confidence_interval: List[float]

class RiskVelocity(BaseModel):
    velocity: float
    momentum: float
    indicator: str

class RiskCascadeNode(BaseModel):
    id: str
    risk_type: str
    description: str
    impact_pct: float
    exposure_amount: float
    children: List['RiskCascadeNode'] = []

class RiskCascade(BaseModel):
    root_cause: str
    total_exposure: float
    nodes: List[RiskCascadeNode]

class EntityRiskProfile(BaseModel):
    entity_id: str
    entity_type: str
    current_score: RiskScore
    velocity: RiskVelocity
    predictions: List[RiskPrediction]
    cascade: Optional[RiskCascade]

class SimulationRequest(BaseModel):
    entity_id: str
    scenario: str
    parameters: Dict[str, float]

class SimulationResult(BaseModel):
    original_exposure: float
    simulated_exposure: float
    impact_diff: float
    cascade: RiskCascade
