from datetime import datetime
from typing import List, Tuple

def calculate_velocity(scores: List[Tuple[datetime, float]]) -> float:
    if len(scores) < 2:
        return 0.0
    
    scores = sorted(scores, key=lambda x: x[0])
    first_time, first_score = scores[0]
    last_time, last_score = scores[-1]
    
    time_diff = (last_time - first_time).total_seconds() / (24 * 3600)
    if time_diff == 0:
        return 0.0
        
    return (last_score - first_score) / time_diff

def calculate_momentum(velocities: List[float]) -> Tuple[float, str]:
    if len(velocities) < 2:
        return 0.0, "Stable"
    
    acceleration = velocities[-1] - velocities[0]
    if acceleration > 5:
        return acceleration, "Accelerating"
    elif acceleration < -5:
        return acceleration, "Decelerating"
    return acceleration, "Stable"

def get_velocity_indicator(velocity: float) -> str:
    if velocity > 2.0:
        return "↑ Rapidly deteriorating"
    elif velocity < -2.0:
        return "↓ Improving"
    return "→ Stable"

class RiskVelocityTracker:
    def __init__(self):
        self.history = []
        
    def add_score(self, timestamp: datetime, score: float):
        self.history.append((timestamp, score))
        
    def get_current_metrics(self) -> dict:
        v = calculate_velocity(self.history)
        return {
            "velocity": v,
            "indicator": get_velocity_indicator(v)
        }
