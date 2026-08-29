"""Risk Prediction Agent Node — Uses StatsForecast for time-series risk prediction."""
from app.agents.state import RiskAssessmentState
from app.ml.registry import registry


def risk_prediction_node(state: RiskAssessmentState):
    """Generate risk score predictions using the trained forecaster model."""
    current_score = state.get("composite_score", 50.0)

    # Use the forecaster model for proper time-series predictions
    forecaster = registry.get_model("forecaster")
    if forecaster is not None:
        try:
            predictions = forecaster.predict(current_score, horizons=[7, 30, 90])
        except Exception as e:
            predictions = _fallback_predictions(current_score)
    else:
        predictions = _fallback_predictions(current_score)

    return {
        "predictions": predictions,
        "audit_trail": [
            f"Risk predictions: "
            f"7d={predictions.get('7_day', {}).get('score', '?')}, "
            f"30d={predictions.get('30_day', {}).get('score', '?')}, "
            f"90d={predictions.get('90_day', {}).get('score', '?')}"
        ],
    }


def _fallback_predictions(current: float) -> dict:
    """Linear extrapolation fallback when forecaster is unavailable."""
    return {
        "7_day": {"score": round(min(100, current * 1.03), 2),
                  "ci": [round(current * 0.92, 2), round(min(100, current * 1.15), 2)]},
        "30_day": {"score": round(min(100, current * 1.08), 2),
                   "ci": [round(current * 0.85, 2), round(min(100, current * 1.3), 2)]},
        "90_day": {"score": round(min(100, current * 1.15), 2),
                   "ci": [round(current * 0.75, 2), round(min(100, current * 1.5), 2)]},
    }
