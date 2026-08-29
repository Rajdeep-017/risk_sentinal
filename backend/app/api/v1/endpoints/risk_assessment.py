"""Risk Assessment API — Triggers the full LangGraph pipeline with real data."""
from fastapi import APIRouter
from app.agents.risk_graph import risk_graph
from app.ml.feature_engineering import entity_features_from_data
import uuid
import numpy as np
import time


router = APIRouter()


def _serialize(obj):
    """Convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(v) for v in obj]
    return obj


@router.post("/")
async def trigger_assessment(entity_id: str, entity_type: str = "customer"):
    """Trigger a full risk assessment pipeline for an entity."""
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    # Load real entity data from processed CSVs
    features = entity_features_from_data(entity_id, entity_type)

    initial_state = {
        "messages": [],
        "entity_id": entity_id,
        "entity_type": entity_type,
        "input_data": features,
        "audit_trail": [f"Started assessment for {entity_type} {entity_id}"],
    }

    start_time = time.perf_counter()
    try:
        final_state = risk_graph.invoke(initial_state, config=config)
        final_state = _serialize(final_state)
        
        total_duration_ms = (time.perf_counter() - start_time) * 1000
        
        return {
            "assessment_id": thread_id,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "composite_score": final_state.get("composite_score", 0),
            "risk_level": final_state.get("risk_level", "LOW"),
            "approval_status": final_state.get("approval_status", "UNKNOWN"),
            "financial_risk": final_state.get("financial_risk", {}),
            "customer_risk": final_state.get("customer_risk", {}),
            "fraud_risk": final_state.get("fraud_risk", {}),
            "operational_risk": final_state.get("operational_risk", {}),
            "cyber_risk": final_state.get("cyber_risk", {}),
            "correlations": final_state.get("correlations", {}),
            "predictions": final_state.get("predictions", {}),
            "root_causes": final_state.get("root_causes", []),
            "simulation_results": final_state.get("simulation_results", {}),
            "mitigations": final_state.get("mitigations", []),
            "policy_decision": final_state.get("policy_decision", {}),
            "audit_trail": final_state.get("audit_trail", []),
            "execution_time_ms": round(total_duration_ms, 2),
        }
    except Exception as e:
        total_duration_ms = (time.perf_counter() - start_time) * 1000
        return {"assessment_id": thread_id, "error": str(e), "status": "failed", "execution_time_ms": round(total_duration_ms, 2)}


@router.get("/{id}")
async def get_assessment(id: str):
    return {"assessment_id": id, "status": "completed"}


@router.get("/history")
async def list_assessments():
    return []
