#!/usr/bin/env python3
"""
RiskSentinel Automated Verification Script
Runs all health checks and API endpoint validations.
Exit codes: 0 = all pass, 1 = health failed, 2 = API failed, 3 = server unreachable
"""
import sys
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
TIMEOUT = 30

def check_health():
    """Verify /health endpoint returns expected structure"""
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=10)
        if r.status_code != 200:
            return False, f"Health status {r.status_code}"
        
        data = r.json()
        required_models = ["credit", "churn", "fraud", "cyber", "operational", "forecaster"]
        
        if data.get("status") != "ok":
            return False, "Status not ok"
        
        models = data.get("models", {})
        for m in required_models:
            if models.get(m) != "loaded":
                return False, f"Model {m} not loaded: {models.get(m)}"
        
        if data.get("rag_documents", 0) < 6:
            return False, f"RAG documents: {data.get('rag_documents')}, expected >= 6"
        
        return True, "Health check passed"
    except Exception as e:
        return False, f"Health check error: {e}"

def check_assessment():
    """Verify risk assessment endpoint"""
    try:
        r = requests.post(
            f"{BASE_URL}/api/v1/assess/?entity_id=C-0001&entity_type=customer",
            timeout=60
        )
        if r.status_code != 200:
            return False, f"Assessment status {r.status_code}"
        
        data = r.json()
        required_keys = ["assessment_id", "entity_id", "composite_score", "risk_level", 
                         "financial_risk", "customer_risk", "fraud_risk", 
                         "operational_risk", "cyber_risk", "correlations"]
        
        for key in required_keys:
            if key not in data:
                return False, f"Missing key: {key}"
        
        if not (0 <= data["composite_score"] <= 100):
            return False, f"Invalid composite_score: {data['composite_score']}"
        
        return True, "Assessment check passed"
    except Exception as e:
        return False, f"Assessment error: {e}"

def check_dashboard():
    """Verify dashboard overview"""
    try:
        r = requests.get(f"{BASE_URL}/api/v1/dashboard/overview", timeout=15)
        if r.status_code != 200:
            return False, f"Dashboard status {r.status_code}"
        
        data = r.json()
        required_keys = ["total_entities_monitored", "high_risk_entities", 
                         "critical_alerts", "total_exposure", "score", 
                         "risk_distribution", "domains"]
        
        for key in required_keys:
            if key not in data:
                return False, f"Missing key: {key}"
        
        return True, "Dashboard check passed"
    except Exception as e:
        return False, f"Dashboard error: {e}"

def check_simulator():
    """Verify simulator endpoint"""
    try:
        r = requests.post(
            f"{BASE_URL}/api/v1/simulate/",
            json={"entity_id": "C-0001", "scenario": "credit_limit_reduction", 
                  "parameters": {"credit_limit": 5000}},
            timeout=15
        )
        if r.status_code != 200:
            return False, f"Simulator status {r.status_code}"
        
        data = r.json()
        required_keys = ["original_exposure", "simulated_exposure", "impact_diff", "cascade"]
        
        for key in required_keys:
            if key not in data:
                return False, f"Missing key: {key}"
        
        return True, "Simulator check passed"
    except Exception as e:
        return False, f"Simulator error: {e}"

def check_approvals():
    """Verify approvals endpoint"""
    try:
        r = requests.get(f"{BASE_URL}/api/v1/approvals/", timeout=10)
        if r.status_code != 200:
            return False, f"Approvals status {r.status_code}"
        
        data = r.json()
        if not isinstance(data, list) or len(data) == 0:
            return False, "Approvals not a list or empty"
        
        if "id" not in data[0] or "action_type" not in data[0]:
            return False, "Approval item missing required fields"
        
        return True, "Approvals check passed"
    except Exception as e:
        return False, f"Approvals error: {e}"

def check_swagger():
    """Verify Swagger UI accessible"""
    try:
        r = requests.get(f"{BASE_URL}/docs", timeout=10)
        if r.status_code != 200:
            return False, f"Swagger status {r.status_code}"
        
        if "swagger" not in r.text.lower() and "openapi" not in r.text.lower():
            return False, "Swagger UI not found in response"
        
        return True, "Swagger check passed"
    except Exception as e:
        return False, f"Swagger error: {e}"

def check_redoc():
    """Verify ReDoc accessible"""
    try:
        r = requests.get(f"{BASE_URL}/redoc", timeout=10)
        if r.status_code != 200:
            return False, f"ReDoc status {r.status_code}"
        
        if "redoc" not in r.text.lower():
            return False, "ReDoc not found in response"
        
        return True, "ReDoc check passed"
    except Exception as e:
        return False, f"ReDoc error: {e}"

def check_openapi():
    """Verify OpenAPI spec accessible"""
    try:
        r = requests.get(f"{BASE_URL}/openapi.json", timeout=10)
        if r.status_code != 200:
            return False, f"OpenAPI status {r.status_code}"
        
        spec = r.json()
        if "openapi" not in spec or "paths" not in spec:
            return False, "Invalid OpenAPI spec"
        
        return True, "OpenAPI check passed"
    except Exception as e:
        return False, f"OpenAPI error: {e}"

def main():
    print("=" * 60)
    print("RiskSentinel Automated Verification")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print()
    
    checks = [
        ("Health Check", check_health, 1),
        ("Risk Assessment", check_assessment, 2),
        ("Dashboard Overview", check_dashboard, 2),
        ("Simulator", check_simulator, 2),
        ("Approvals", check_approvals, 2),
        ("Swagger UI", check_swagger, 2),
        ("ReDoc", check_redoc, 2),
        ("OpenAPI Spec", check_openapi, 2),
    ]
    
    all_passed = True
    failed_checks = []
    
    for name, check_func, exit_code in checks:
        print(f"[CHECK] {name}...", end=" ", flush=True)
        passed, msg = check_func()
        if passed:
            print("[PASS]")
        else:
            print(f"[FAIL] - {msg}")
            all_passed = False
            failed_checks.append((name, exit_code))
    
    print()
    print("=" * 60)
    if all_passed:
        print("[SUCCESS] ALL CHECKS PASSED")
        return 0
    else:
        print("[FAILURE] SOME CHECKS FAILED:")
        for name, code in failed_checks:
            print(f"   - {name} (exit code {code})")
        # Return highest exit code
        return max(code for _, code in failed_checks)

if __name__ == "__main__":
    sys.exit(main())