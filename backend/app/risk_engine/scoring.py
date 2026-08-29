def calculate_risk_score(ml_prob: float, anomaly: float, trend: float, exposure: float, criticality: float, correlation: float) -> float:
    score = (
        0.30 * ml_prob +
        0.20 * anomaly +
        0.15 * trend +
        0.15 * exposure +
        0.10 * criticality +
        0.10 * correlation
    )
    return min(max(score, 0.0), 100.0)

def get_risk_level(score: float) -> str:
    if score < 30:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 70:
        return "HIGH"
    elif score < 85:
        return "VERY_HIGH"
    return "CRITICAL"

def calculate_composite_score(scores: dict) -> float:
    weights = {'financial': 0.3, 'fraud': 0.25, 'cyber': 0.2, 'operational': 0.15, 'customer': 0.1}
    total = 0.0
    for k, w in weights.items():
        total += scores.get(k, 0.0) * w
    return total
