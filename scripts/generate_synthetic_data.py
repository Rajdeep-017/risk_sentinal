import pandas as pd
import numpy as np
import random
from pathlib import Path
from datetime import datetime, timedelta

BASE_DIR = Path("d:/Razorpay project")
DATA_DIR = BASE_DIR / "data" / "synthetic"

def setup():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def generate_suppliers(num_suppliers=50) -> pd.DataFrame:
    categories = ['raw_materials', 'components', 'packaging', 'logistics', 'services']
    criticalities = ['low', 'medium', 'high', 'critical']
    regions = ['domestic', 'asia', 'europe', 'americas']
    
    suppliers = []
    # Set one critical supplier to have a low reliability for the scenario
    for i in range(1, num_suppliers + 1):
        if i == 4:
            rel_score = 0.2
            crit = 'critical'
        else:
            rel_score = np.random.beta(a=8, b=2)
            crit = random.choice(criticalities)
            
        suppliers.append({
            'supplier_id': f"S-{i:03d}",
            'supplier_name': f"Supplier_{i}",
            'reliability_score': round(rel_score, 4),
            'avg_delivery_days': np.random.randint(3, 16),
            'category': random.choice(categories),
            'criticality': crit,
            'contract_value': np.random.randint(100000, 5000000),
            'region': random.choice(regions)
        })
    return pd.DataFrame(suppliers)

def generate_operations(suppliers_df, num_records=3000):
    start_date = datetime.now() - timedelta(days=100)
    operations = []
    
    for i in range(1, num_records + 1):
        supplier = suppliers_df.sample(1).iloc[0]
        date = start_date + timedelta(days=np.random.randint(0, 100))
        
        expected_delivery = date + timedelta(days=int(supplier['avg_delivery_days']))
        
        # High correlation between reliability and delay
        if np.random.random() > supplier['reliability_score']:
            delay_days = int(np.random.exponential(scale=5))
        else:
            delay_days = max(0, int(np.random.normal(0, 1)))
            
        actual_delivery = expected_delivery + timedelta(days=delay_days)
        sla_breach = delay_days > 2
        
        # Drops when supply delayed
        production_capacity = max(0, min(100, int(np.random.normal(95, 2)) - (delay_days * 5)))
        downtime_hours = max(0, delay_days * 8 + int(np.random.normal(0, 2))) if delay_days > 0 else 0
        quality_score = max(50, min(100, int(np.random.normal(95, 3)) - (delay_days * 2)))
        
        operations.append({
            'operation_id': f"OP-{i:04d}",
            'date': date.strftime('%Y-%m-%d'),
            'supplier_id': supplier['supplier_id'],
            'expected_delivery_date': expected_delivery.strftime('%Y-%m-%d'),
            'actual_delivery_date': actual_delivery.strftime('%Y-%m-%d'),
            'delay_days': delay_days,
            'order_value': np.random.randint(10000, 500000),
            'sla_breach': sla_breach,
            'production_capacity_pct': production_capacity,
            'downtime_hours': downtime_hours,
            'quality_score': quality_score
        })
    return pd.DataFrame(operations).sort_values('date')

def generate_inventory(suppliers_df, operations_df):
    start_date = datetime.now() - timedelta(days=100)
    inventory = []
    
    # Calculate average daily capacity dropping per supplier delay
    delay_by_date = operations_df.groupby('date')['delay_days'].mean().to_dict()
    
    inv_id = 1
    for day in range(100):
        current_date = (start_date + timedelta(days=day)).strftime('%Y-%m-%d')
        daily_delay = delay_by_date.get(current_date, 0)
        
        for p in range(1, 51):
            supplier = suppliers_df.sample(1).iloc[0]
            daily_demand = max(10, int(np.random.normal(100, 20)))
            
            # Stock drops faster when delays happen
            stock_level = max(0, int(np.random.normal(500, 50)) - (daily_delay * daily_demand * 0.5))
            
            reorder_point = daily_demand * 3
            days_coverage = stock_level / daily_demand if daily_demand > 0 else 999
            
            inventory.append({
                'inventory_id': f"INV-{inv_id:06d}",
                'product_id': f"P-{p:03d}",
                'supplier_id': supplier['supplier_id'],
                'date': current_date,
                'stock_level': int(stock_level),
                'daily_demand': daily_demand,
                'reorder_point': reorder_point,
                'lead_time_days': int(supplier['avg_delivery_days']),
                'days_of_coverage': round(days_coverage, 2)
            })
            inv_id += 1
            
    return pd.DataFrame(inventory)

def generate_support_tickets(operations_df):
    start_date = datetime.now() - timedelta(days=100)
    tickets = []
    
    delay_by_date = operations_df.groupby('date')['delay_days'].mean().to_dict()
    
    for i in range(1, 2001):
        date = start_date + timedelta(days=np.random.randint(0, 100))
        date_str = date.strftime('%Y-%m-%d')
        daily_delay = delay_by_date.get(date_str, 0)
        
        category = random.choice(['billing', 'delivery', 'quality', 'service', 'technical'])
        if daily_delay > 2 and np.random.random() > 0.5:
            category = 'delivery'
            
        severity = 'low'
        if category == 'delivery' and daily_delay > 5:
            severity = random.choice(['high', 'critical'])
        else:
            severity = random.choice(['low', 'medium', 'high', 'critical'])
            
        resolution_time = int(np.random.exponential(scale=24))
        if severity in ['high', 'critical']:
            resolution_time += 48
            
        sat_score = max(1, min(5, int(np.random.normal(4, 1))))
        if resolution_time > 48 or severity in ['high', 'critical']:
            sat_score = max(1, sat_score - 2)
            
        escalated = (sat_score <= 2) or (severity == 'critical')
        
        tickets.append({
            'ticket_id': f"TKT-{i:05d}",
            'customer_id': f"C-{np.random.randint(1, 5001):04d}",
            'date': date_str,
            'category': category,
            'severity': severity,
            'resolution_time_hours': resolution_time,
            'satisfaction_score': sat_score,
            'related_order_id': f"ORD-{np.random.randint(1000, 9999)}",
            'escalated': escalated
        })
    return pd.DataFrame(tickets).sort_values('date')

def generate_financial_metrics(operations_df, tickets_df):
    start_date = datetime.now() - timedelta(days=100)
    metrics = []
    
    delay_by_date = operations_df.groupby('date')['delay_days'].mean().to_dict()
    escalations_by_date = tickets_df.groupby('date')['escalated'].sum().to_dict()
    
    cash_balance = 10000000
    
    for day in range(100):
        current_date = (start_date + timedelta(days=day)).strftime('%Y-%m-%d')
        daily_delay = delay_by_date.get(current_date, 0)
        daily_escalations = escalations_by_date.get(current_date, 0)
        
        revenue = max(50000, int(np.random.normal(500000, 50000)) - (daily_delay * 10000) - (daily_escalations * 5000))
        expenses = int(np.random.normal(400000, 20000)) + (daily_delay * 5000)
        
        margin = (revenue - expenses) / revenue if revenue > 0 else 0
        
        defaults = int(np.random.exponential(scale=2))
        if margin < 0.1:
            defaults += int(np.random.exponential(scale=5))
            
        cash_balance += (revenue - expenses) - (defaults * 5000)
        
        metrics.append({
            'date': current_date,
            'daily_revenue': revenue,
            'daily_expenses': expenses,
            'accounts_receivable': int(np.random.normal(2000000, 100000)),
            'accounts_payable': int(np.random.normal(1500000, 100000)),
            'cash_balance': cash_balance,
            'credit_utilization': round(max(0.1, min(0.9, np.random.normal(0.4, 0.1) + (defaults * 0.05))), 2),
            'payment_defaults_count': defaults,
            'outstanding_invoices': int(np.random.normal(500, 50)),
            'operating_margin': round(margin, 4)
        })
        
    return pd.DataFrame(metrics)

def main():
    setup()
    print("Generating Suppliers...")
    suppliers_df = generate_suppliers()
    suppliers_df.to_csv(DATA_DIR / 'suppliers.csv', index=False)
    
    print("Generating Operations...")
    operations_df = generate_operations(suppliers_df)
    operations_df.to_csv(DATA_DIR / 'operations.csv', index=False)
    
    print("Generating Inventory...")
    inventory_df = generate_inventory(suppliers_df, operations_df)
    inventory_df.to_csv(DATA_DIR / 'inventory.csv', index=False)
    
    print("Generating Support Tickets...")
    tickets_df = generate_support_tickets(operations_df)
    tickets_df.to_csv(DATA_DIR / 'support_tickets.csv', index=False)
    
    print("Generating Financial Metrics...")
    finance_df = generate_financial_metrics(operations_df, tickets_df)
    finance_df.to_csv(DATA_DIR / 'financial_metrics.csv', index=False)
    
    print("Synthetic data generation complete!")

if __name__ == "__main__":
    main()
