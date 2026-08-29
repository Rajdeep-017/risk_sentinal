import json
import os
from pathlib import Path

BASE_DIR = Path("d:/Razorpay project")
SCENARIOS_DIR = BASE_DIR / "data" / "scenarios"

def setup():
    SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)

def write_json(filename, data):
    with open(SCENARIOS_DIR / filename, 'w') as f:
        json.dump(data, f, indent=2)

def main():
    setup()
    
    # 1. customer_distress.json
    write_json("customer_distress.json", {
      "scenario_name": "Customer Distress Signal",
      "description": "Multiple converging signals indicate severe customer distress",
      "entity_id": "C-1024",
      "entity_type": "customer",
      "signals": {
        "usage_change_pct": -23.4,
        "complaint_count": 8,
        "complaint_change_pct": 41.2,
        "payment_delay_days": 18,
        "payment_failure_change_pct": 18.3,
        "support_tickets_change_pct": 31.2,
        "satisfaction_score": 2.1,
        "monthly_charges": 89.50,
        "tenure_months": 14,
        "clv": 1253.00
      },
      "expected_risks": {
        "churn_probability": 0.82,
        "revenue_exposure": 840000,
        "financial_risk": 0.67,
        "customer_risk": 0.88,
        "overall_risk_score": 78
      },
      "expected_cascade": ["Reduced cash flow", "Increased support costs", "Negative word-of-mouth"],
      "expected_mitigation": ["Proactive account review", "Targeted retention offer", "Prioritized support channel"]
    })

    # 2. supplier_crisis.json
    write_json("supplier_crisis.json", {
      "scenario_name": "Supplier S-104 Major Delay",
      "description": "Critical supplier experiencing major logistics failure",
      "entity_id": "S-104",
      "entity_type": "supplier",
      "signals": {
        "avg_delay_increase_days": 12,
        "sla_breach_rate": 0.85,
        "communication_delays_hrs": 48,
        "inventory_depletion_rate": 1.5
      },
      "expected_risks": {
        "supply_chain_disruption": 0.95,
        "production_impact": 0.80,
        "overall_risk_score": 85
      },
      "expected_cascade": ["Production halt", "Order fulfillment delays", "Customer dissatisfaction"],
      "expected_mitigation": ["Activate backup supplier S-022", "Reallocate existing inventory", "Notify critical B2B customers"]
    })

    # 3. coordinated_fraud.json
    write_json("coordinated_fraud.json", {
      "scenario_name": "Multi-signal Fraud Attack",
      "description": "Coordinated synthetic identity and transaction fraud",
      "entity_id": "GRP-992",
      "entity_type": "cluster",
      "signals": {
        "velocity_spike_multiplier": 5.2,
        "new_account_clustering": 0.88,
        "shared_device_ids": 14,
        "distance_from_home_avg": 450
      },
      "expected_risks": {
        "fraud_loss_exposure": 450000,
        "regulatory_risk": 0.60,
        "overall_risk_score": 92
      },
      "expected_cascade": ["Chargeback spikes", "Payment processor fines", "Reputational damage"],
      "expected_mitigation": ["Freeze identified accounts", "Implement step-up auth", "File SARs"]
    })

    # 4. cyber_incident.json
    write_json("cyber_incident.json", {
      "scenario_name": "Network Intrusion & Lateral Movement",
      "description": "Advanced persistent threat indicators observed in internal subnet",
      "entity_id": "NET-04",
      "entity_type": "network_segment",
      "signals": {
        "unusual_port_scanning": True,
        "admin_credential_brute_force": 4500,
        "data_exfiltration_attempts": 12,
        "off_hours_access": 0.95
      },
      "expected_risks": {
        "data_breach_probability": 0.75,
        "system_downtime_risk": 0.85,
        "overall_risk_score": 95
      },
      "expected_cascade": ["Data loss", "Ransomware deployment", "Regulatory fines"],
      "expected_mitigation": ["Isolate affected subnet", "Reset compromised credentials", "Initiate incident response protocol"]
    })

    # 5. financial_stress.json
    write_json("financial_stress.json", {
      "scenario_name": "Deteriorating Financial Metrics",
      "description": "Leading indicators showing significant cash flow and margin compression",
      "entity_id": "ORG-MAIN",
      "entity_type": "organization",
      "signals": {
        "days_sales_outstanding_increase": 15,
        "operating_margin_compression": 0.08,
        "credit_utilization_spike": 0.25,
        "payment_defaults_rate": 0.04
      },
      "expected_risks": {
        "liquidity_crisis": 0.70,
        "covenant_breach": 0.45,
        "overall_risk_score": 82
      },
      "expected_cascade": ["Credit rating downgrade", "Vendor payment delays", "Hiring freezes"],
      "expected_mitigation": ["Accelerate collections", "Draw down revolver", "Delay non-critical CapEx"]
    })

    print("Successfully created all scenario files!")

if __name__ == "__main__":
    main()
