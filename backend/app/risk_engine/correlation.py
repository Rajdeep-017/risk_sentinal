from typing import List, Dict

class Correlation:
    def __init__(self, name: str, weight: float, involved_signals: List[str]):
        self.name = name
        self.weight = weight
        self.involved_signals = involved_signals

class CorrelationEngine:
    def __init__(self):
        self.patterns = [
            Correlation("Churn Risk", 0.8, ["complaints", "payment_failures", "usage_drop"]),
            Correlation("Cyber Fraud", 0.9, ["unusual_login", "new_device", "large_tx", "impossible_location"]),
            Correlation("Operational Cascade", 0.85, ["supplier_delay", "inventory_drop", "order_delay", "complaints"]),
            Correlation("Financial Stress", 0.95, ["receivables_up", "cash_down", "defaults_up"])
        ]

    def detect_correlations(self, risk_signals: Dict[str, float]) -> List[Correlation]:
        active = []
        for p in self.patterns:
            matches = sum(1 for s in p.involved_signals if risk_signals.get(s, 0) > 0.5)
            if matches >= 2:
                active.append(p)
        return active

    def calculate_correlation_score(self, active_correlations: List[Correlation]) -> float:
        if not active_correlations:
            return 0.0
        return min(sum(c.weight * 20 for c in active_correlations), 100.0)
