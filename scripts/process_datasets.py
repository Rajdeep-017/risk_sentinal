import pandas as pd
import numpy as np
import json
from pathlib import Path
from datetime import datetime, timedelta

BASE_DIR = Path("d:/Razorpay project")
PROCESSED_DIR = BASE_DIR / "data" / "processed"
RAW_DIR = BASE_DIR / "data" / "raw"

def setup():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

def _sigmoid(x):
    return 1 / (1 + np.exp(-x))
 
 
 
def process_customers():
    print("Processing customers...")
    n = 5000
    segment = np.random.choice(['retail', 'sme', 'enterprise'], n)
    tenure_months = np.random.randint(1, 72, n)
    monthly_charges = np.round(np.random.uniform(20.0, 150.0, n), 2)
    total_charges = np.round(np.random.uniform(100.0, 8000.0, n), 2)
    credit_limit = np.random.choice([1000, 5000, 10000, 50000], n)
    credit_utilization = np.round(np.random.uniform(0.1, 0.9, n), 2)
    contract_type = np.random.choice(['Month-to-month', 'One year', 'Two year'], n)
    payment_method = np.random.choice(
        ['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card'], n)
 
    # churn logic: short tenure, high charges, month-to-month contract -> higher churn risk
    contract_penalty = np.where(contract_type == 'Month-to-month', 1.2,
                        np.where(contract_type == 'One year', 0.0, -0.8))
    churn_logit = (
        -1.4
        - 0.04 * (tenure_months - 36) / 36   # longer tenure -> lower risk
        + 0.02 * (monthly_charges - 85) / 65   # higher charges -> higher risk
        + contract_penalty
        + np.random.normal(0, 0.6, n)          # noise so it's not trivial
    )
    churn_flag = (np.random.uniform(0, 1, n) < _sigmoid(churn_logit)).astype(int)
 
    # default logic: high utilization + high balance-ish signal -> higher default risk
    default_logit = (
        -2.2
        + 2.2 * (credit_utilization - 0.5)
        + 0.3 * (monthly_charges / credit_limit * 1000)
        + np.random.normal(0, 0.7, n)
    )
    default_flag = (np.random.uniform(0, 1, n) < _sigmoid(default_logit)).astype(int)
 
    df = pd.DataFrame({
        'customer_id': [f"C-{i:04d}" for i in range(1, n + 1)],
        'name': [f"Customer {i}" for i in range(1, n + 1)],
        'segment': segment,
        'tenure_months': tenure_months,
        'monthly_charges': monthly_charges,
        'total_charges': total_charges,
        'credit_limit': credit_limit,
        'credit_utilization': credit_utilization,
        'education': np.random.choice(['High School', 'Bachelors', 'Masters', 'PhD'], n),
        'marital_status': np.random.choice(['Single', 'Married'], n),
        'age': np.random.randint(18, 80, n),
        'phone_service': np.random.choice(['Yes', 'No'], n),
        'internet_service': np.random.choice(['DSL', 'Fiber optic', 'No'], n),
        'contract_type': contract_type,
        'payment_method': payment_method,
        'churn_flag': churn_flag,
        'default_flag': default_flag,
    })
    df.to_csv(PROCESSED_DIR / 'customers.csv', index=False)
 
 
def process_transactions():
    print("Processing transactions...")
    n = 9999
    start_date = datetime.now() - timedelta(days=100)
    amount = np.round(np.random.exponential(scale=100.0, size=n), 2)
    velocity_1h = np.random.randint(1, 5, n)
    velocity_24h = np.random.randint(1, 15, n)
    distance_from_home = np.round(np.random.exponential(scale=50.0, size=n), 2)
    is_online = np.random.choice([True, False], n)
    hour = np.random.randint(0, 24, n)
 
    # fraud logic: use CONTINUOUS scaled features, not rare binary thresholds.
    # amount>400 only fires ~1.8% of the time (exponential tail), so a hard
    # cutoff there contributes almost no variance to the label -- noise then
    # dominates. Scaling by the distribution's own mean keeps every row
    # contributing signal, and rebalancing noise (0.5 vs 0.8) keeps the
    # signal-to-noise ratio > 1 instead of < 1.
    amount_z = amount / 100.0          # exponential(scale=100) -> mean ~1, std ~1
    dist_z = distance_from_home / 50.0  # exponential(scale=50) -> mean ~1, std ~1
    odd_hour = ((hour < 5) | (hour > 22)).astype(int)
 
    fraud_logit = (
        -5.6
        + 0.9 * amount_z
        + 0.35 * velocity_1h
        + 0.55 * dist_z
        + 0.5 * odd_hour
        + 0.3 * is_online.astype(int)
        + np.random.normal(0, 0.5, n)
    )
    is_fraud = (np.random.uniform(0, 1, n) < _sigmoid(fraud_logit)).astype(int)
 
    df = pd.DataFrame({
        'transaction_id': [f"TXN-{i:08d}" for i in range(1, n + 1)],
        'customer_id': [f"C-{np.random.randint(1, 5001):04d}" for _ in range(n)],
        'timestamp': [(start_date + timedelta(days=int(np.random.randint(0, 100)), hours=int(h))).isoformat() for h in hour],
        'amount': amount,
        'merchant_category': np.random.choice(['retail', 'travel', 'food', 'digital', 'utilities'], n),
        'location_lat': np.round(np.random.uniform(-90.0, 90.0, n), 4),
        'location_lon': np.round(np.random.uniform(-180.0, 180.0, n), 4),
        'device_id': [f"DEV-{np.random.randint(1, 10000):05d}" for _ in range(n)],
        'is_online': is_online,
        'velocity_1h': velocity_1h,
        'velocity_24h': velocity_24h,
        'distance_from_home': distance_from_home,
        'is_fraud': is_fraud,
    })
    df.to_csv(PROCESSED_DIR / 'transactions.csv', index=False)
 
 
def process_payments():
    print("Processing payments...")
    n = 19999
    bill_amount = np.round(np.random.uniform(50.0, 5000.0, n), 2)
    credit_limit = np.random.choice([1000, 5000, 10000], n)
    balance = np.round(np.random.uniform(0.0, 10000.0, n), 2)
    utilization = balance / credit_limit
 
    # payment_delay_days is generated from utilization (NOT used as an input feature downstream)
    delay_logit = -1.0 + 3.0 * (utilization - 0.5) + np.random.normal(0, 0.9, n)
    payment_delay_days = np.clip(
        (_sigmoid(delay_logit) * 90 + np.random.normal(0, 8, n)), 0, 90
    ).astype(int)
 
    payment_amount = np.round(bill_amount * np.clip(1 - utilization * 0.6 + np.random.normal(0, 0.15, n), 0, 1.2), 2)
 
    # default_flag as its own independent-ish label so credit_risk_model.py can use it directly
    default_logit = -2.0 + 2.5 * (utilization - 0.5) + 0.02 * (payment_delay_days - 30) + np.random.normal(0, 0.6, n)
    default_flag = (np.random.uniform(0, 1, n) < _sigmoid(default_logit)).astype(int)
 
    df = pd.DataFrame({
        'payment_id': [f"PAY-{i:06d}" for i in range(1, n + 1)],
        'customer_id': [f"C-{np.random.randint(1, 5001):04d}" for _ in range(n)],
        'month': [f"2023-{np.random.randint(1, 13):02d}" for _ in range(n)],
        'bill_amount': bill_amount,
        'payment_amount': payment_amount,
        'payment_status': np.random.choice(['on_time', 'late_1mo', 'late_2mo', 'late_3mo'], n),
        'payment_delay_days': payment_delay_days,
        'credit_limit': credit_limit,
        'balance': balance,
        'default_flag': default_flag,
    })
    df.to_csv(PROCESSED_DIR / 'payments.csv', index=False)
 
 
def process_cyber_events():
    print("Processing cyber events...")
    n = 49999
    start_date = datetime.now() - timedelta(days=100)
    protocol = np.random.choice(['tcp', 'udp', 'icmp'], n)
    service = np.random.choice(['http', 'ftp', 'ssh', 'dns'], n)
    duration = np.round(np.random.uniform(0.0, 10.0, n), 3)
    src_bytes = np.random.randint(100, 10000, n)
    dst_bytes = np.random.randint(100, 10000, n)
 
    # attack logic: high src_bytes, very short duration, icmp protocol -> higher attack likelihood
    attack_logit = (
        -3.4
        + 1.3 * (src_bytes > 6000)
        + 1.0 * (duration < 0.05)
        + 0.7 * (protocol == 'icmp')
        + 0.4 * (service == 'ftp')
        + np.random.normal(0, 0.8, n)
    )
    is_attack = (np.random.uniform(0, 1, n) < _sigmoid(attack_logit)).astype(int)
    atk_cat = np.where(is_attack == 1,
                        np.random.choice(['DoS', 'Exploits', 'Fuzzers', 'Generic'], n),
                        'Normal')
    severity = np.where(is_attack == 1, 'High', 'Low')
 
    df = pd.DataFrame({
        'event_id': [f"CYB-{i:07d}" for i in range(1, n + 1)],
        'timestamp': [(start_date + timedelta(days=int(np.random.randint(0, 100)), hours=int(np.random.randint(0, 24)))).isoformat() for _ in range(n)],
        'source_ip': [f"192.168.{np.random.randint(0,255)}.{np.random.randint(0,255)}" for _ in range(n)],
        'dest_ip': [f"10.0.{np.random.randint(0,255)}.{np.random.randint(0,255)}" for _ in range(n)],
        'protocol': protocol,
        'service': service,
        'duration': duration,
        'src_bytes': src_bytes,
        'dst_bytes': dst_bytes,
        'attack_category': atk_cat,
        'is_attack': is_attack,
        'severity': severity,
    })
    df.to_csv(PROCESSED_DIR / 'cyber_events.csv', index=False)

def generate_risk_events():
    print("Generating unified risk events...")
    events = []
    start_date = datetime.now() - timedelta(days=100)
    for i in range(1, 5000):
        risk_type = np.random.choice(['financial', 'customer', 'fraud', 'operational', 'cyber'])
        if risk_type in ['financial', 'customer']:
            entity_id = f"C-{np.random.randint(1, 5001):04d}"
            entity_type = 'customer'
        elif risk_type == 'operational':
            entity_id = f"S-{np.random.randint(1, 51):03d}"
            entity_type = 'supplier'
        else:
            entity_id = f"SYS-{np.random.randint(1, 100):03d}"
            entity_type = 'system'
            
        events.append({
            'event_id': f"RSK-{i:06d}",
            'timestamp': (start_date + timedelta(days=np.random.randint(0, 100))).isoformat(),
            'entity_id': entity_id,
            'entity_type': entity_type,
            'department': np.random.choice(['Finance', 'Support', 'IT', 'Operations']),
            'risk_type': risk_type,
            'risk_score': np.random.randint(10, 100),
            'risk_level': np.random.choice(['Low', 'Moderate', 'High', 'Critical']),
            'risk_velocity': round(np.random.uniform(0.1, 5.0), 2),
            'key_metrics': json.dumps({"metric_1": np.random.randint(1, 10), "metric_2": np.random.randint(10, 100)}),
            'ground_truth': np.random.choice([True, False])
        })
    df = pd.DataFrame(events)
    df.to_csv(PROCESSED_DIR / 'risk_events.csv', index=False)

def main():
    setup()
    process_customers()
    process_transactions()
    process_payments()
    process_cyber_events()
    generate_risk_events()
    print("Dataset processing complete!")

if __name__ == "__main__":
    main()
