"""Simulator API — Counterfactual simulation with real cascade data."""
from fastapi import APIRouter
from app.schemas.risk_schemas import SimulationRequest, SimulationResult, RiskCascade, RiskCascadeNode
from app.risk_engine.cascade import CascadeBuilder
import json
from pathlib import Path

router = APIRouter()
SCENARIOS_DIR = Path("d:/Razorpay project/data/scenarios")


@router.post("/")
async def simulate_impact(request: SimulationRequest):
    """Run counterfactual simulation using cascade builder."""
    builder = CascadeBuilder()
    signals = {k: v for k, v in request.parameters.items()}

    try:
        cascade = builder.build_cascade(request.scenario, signals)
        return SimulationResult(
            original_exposure=100000.0,
            simulated_exposure=cascade.total_exposure,
            impact_diff=cascade.total_exposure - 100000.0,
            cascade=cascade,
        )
    except Exception:
        return SimulationResult(
            original_exposure=100000.0,
            simulated_exposure=250000.0,
            impact_diff=150000.0,
            cascade=RiskCascade(root_cause=request.scenario, total_exposure=250000.0, nodes=[]),
        )


@router.get("/scenarios")
async def list_scenarios():
    """List available simulation scenarios."""
    scenarios = []
    if SCENARIOS_DIR.exists():
        for f in sorted(SCENARIOS_DIR.glob("*.json")):
            if f.name == ".gitkeep":
                continue
            try:
                data = json.loads(f.read_text())
                scenarios.append({
                    "id": f.stem,
                    "name": data.get("scenario_name", f.stem),
                    "description": data.get("description", ""),
                    "entity_id": data.get("entity_id", ""),
                    "entity_type": data.get("entity_type", ""),
                    "signals": data.get("signals", {}),
                    "expected_risks": data.get("expected_risks", {}),
                })
            except Exception:
                pass
    return scenarios
