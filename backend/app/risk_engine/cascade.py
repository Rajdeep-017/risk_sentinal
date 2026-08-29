from app.schemas.risk_schemas import RiskCascade, RiskCascadeNode
from typing import Dict

class CascadeBuilder:
    def __init__(self):
        pass

    def build_cascade(self, root_cause: str, signals: Dict[str, float]) -> RiskCascade:
        nodes = []
        
        # Financial risk cascades
        if root_cause in ("credit_limit", "utilization_ratio", "payment_amount", "balance", "payment_ratio",
                          "credit_limit_increase", "credit_limit_decrease", "utilization_change"):
            nodes.extend(self._build_financial_cascade(root_cause, signals))
        
        # Customer risk cascades
        elif root_cause in ("month_to_month_contract", "high_credit_utilization", "high_churn_risk"):
            nodes.extend(self._build_customer_cascade(root_cause, signals))
        
        # Fraud risk cascades
        elif root_cause in ("velocity_spike", "unusual_location", "high_value_transaction", "statistical_anomaly"):
            nodes.extend(self._build_fraud_cascade(root_cause, signals))
        
        # Operational risk cascades
        elif root_cause in ("supplier_delay", "SLA breach risk", "Predicted delivery delay"):
            nodes.extend(self._build_operational_cascade(root_cause, signals))
        
        # Cyber risk cascades
        elif root_cause in ("high_outbound_traffic", "ml_flagged"):
            nodes.extend(self._build_cyber_cascade(root_cause, signals))
        
        # Cross-risk cascades
        elif "Cross-risk cascade" in root_cause:
            nodes.extend(self._build_cross_risk_cascade(root_cause, signals))
        
        return RiskCascade(
            root_cause=root_cause,
            total_exposure=sum(self.estimate_cascade_exposure(n) for n in nodes),
            nodes=nodes
        )

    def _build_financial_cascade(self, root_cause: str, signals: Dict[str, float]) -> list:
        financial_stress = signals.get("financial_stress", 0.5)
        base_exposure = 100000 * financial_stress
        nodes = []
        
        n1 = RiskCascadeNode(
            id="n1", risk_type="financial", description="Cash Flow Deterioration",
            impact_pct=0.4, exposure_amount=base_exposure * 0.4
        )
        n2 = RiskCascadeNode(
            id="n2", risk_type="customer", description="Customer Payment Delays",
            impact_pct=0.3, exposure_amount=base_exposure * 0.3
        )
        n3 = RiskCascadeNode(
            id="n3", risk_type="operational", description="Supplier Payment Issues",
            impact_pct=0.3, exposure_amount=base_exposure * 0.3
        )
        n1.children.extend([n2, n3])
        nodes.append(n1)
        return nodes

    def _build_customer_cascade(self, root_cause: str, signals: Dict[str, float]) -> list:
        churn_risk = signals.get("churn_risk", 0.5)
        base_exposure = 50000 * churn_risk
        nodes = []
        
        n1 = RiskCascadeNode(
            id="n1", risk_type="customer", description="Revenue Attrition",
            impact_pct=0.5, exposure_amount=base_exposure * 0.5
        )
        n2 = RiskCascadeNode(
            id="n2", risk_type="financial", description="Reduced Cash Inflows",
            impact_pct=0.3, exposure_amount=base_exposure * 0.3
        )
        n3 = RiskCascadeNode(
            id="n3", risk_type="operational", description="Service Delivery Impact",
            impact_pct=0.2, exposure_amount=base_exposure * 0.2
        )
        n1.children.extend([n2, n3])
        nodes.append(n1)
        return nodes

    def _build_fraud_cascade(self, root_cause: str, signals: Dict[str, float]) -> list:
        base_exposure = 200000
        nodes = []
        
        n1 = RiskCascadeNode(
            id="n1", risk_type="fraud", description="Direct Fraud Loss",
            impact_pct=0.6, exposure_amount=base_exposure * 0.6
        )
        n2 = RiskCascadeNode(
            id="n2", risk_type="financial", description="Chargeback & Recovery Costs",
            impact_pct=0.2, exposure_amount=base_exposure * 0.2
        )
        n3 = RiskCascadeNode(
            id="n3", risk_type="customer", description="Reputational Damage",
            impact_pct=0.2, exposure_amount=base_exposure * 0.2
        )
        n1.children.extend([n2, n3])
        nodes.append(n1)
        return nodes

    def _build_operational_cascade(self, root_cause: str, signals: Dict[str, float]) -> list:
        delay_days = signals.get("delay_days", 5)
        supplier_delay = signals.get("supplier_delay", 0.5)
        base_exposure = delay_days * 10000 * supplier_delay
        nodes = []
        
        n1 = RiskCascadeNode(
            id="n1", risk_type="operational", description="Inventory Shortage",
            impact_pct=0.4, exposure_amount=base_exposure * 0.4
        )
        n2 = RiskCascadeNode(
            id="n2", risk_type="customer", description="Order Fulfillment Delays",
            impact_pct=0.35, exposure_amount=base_exposure * 0.35
        )
        n3 = RiskCascadeNode(
            id="n3", risk_type="financial", description="Revenue Loss from Stockouts",
            impact_pct=0.25, exposure_amount=base_exposure * 0.25
        )
        n1.children.extend([n2, n3])
        nodes.append(n1)
        return nodes

    def _build_cyber_cascade(self, root_cause: str, signals: Dict[str, float]) -> list:
        base_exposure = 500000
        nodes = []
        
        n1 = RiskCascadeNode(
            id="n1", risk_type="cyber", description="Data Breach / System Compromise",
            impact_pct=0.5, exposure_amount=base_exposure * 0.5
        )
        n2 = RiskCascadeNode(
            id="n2", risk_type="financial", description="Regulatory Fines & Legal Costs",
            impact_pct=0.3, exposure_amount=base_exposure * 0.3
        )
        n3 = RiskCascadeNode(
            id="n3", risk_type="customer", description="Customer Trust Loss & Churn",
            impact_pct=0.2, exposure_amount=base_exposure * 0.2
        )
        n1.children.extend([n2, n3])
        nodes.append(n1)
        return nodes

    def _build_cross_risk_cascade(self, root_cause: str, signals: Dict[str, float]) -> list:
        base_exposure = 1000000
        nodes = []
        
        n1 = RiskCascadeNode(
            id="n1", risk_type="enterprise", description=root_cause,
            impact_pct=1.0, exposure_amount=base_exposure
        )
        n2 = RiskCascadeNode(
            id="n2", risk_type="financial", description="Compound Financial Impact",
            impact_pct=0.4, exposure_amount=base_exposure * 0.4
        )
        n3 = RiskCascadeNode(
            id="n3", risk_type="operational", description="Operational Disruption",
            impact_pct=0.3, exposure_amount=base_exposure * 0.3
        )
        n4 = RiskCascadeNode(
            id="n4", risk_type="customer", description="Customer Impact",
            impact_pct=0.3, exposure_amount=base_exposure * 0.3
        )
        n1.children.extend([n2, n3, n4])
        nodes.append(n1)
        return nodes

    def estimate_cascade_exposure(self, node: RiskCascadeNode) -> float:
        total = node.exposure_amount
        for child in node.children:
            total += self.estimate_cascade_exposure(child)
        return total
