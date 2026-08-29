# 🛡️ RiskSentinel

## Enterprise Risk Intelligence Platform

> **Early-Warning. Cross-Risk Correlation. Decision Intelligence.**

RiskSentinel continuously monitors financial, customer, operational, fraud, and cyber signals, detects emerging risks, correlates them across the enterprise, predicts their future impact, explains why they are occurring, and autonomously recommends mitigation actions with human approval.

---

## 🏗️ Architecture

```
                         ┌─────────────────────────┐
                         │     DATA SOURCES         │
                         └────────────┬────────────┘
                                      │
        ┌──────────────┬──────────────┼──────────────┬──────────────┐
        ↓              ↓              ↓              ↓              ↓
   Financial       Customer      Transaction     Operations       Cyber
      Data            Data           Data           Data           Data
        │              │              │              │              │
        └──────────────┴──────────────┼──────────────┴──────────────┘
                                      ↓
                           Data Quality Agent
                                      ↓
                           Feature Engineering
                                      ↓
              ┌─────────────────────────────────────────┐
              │          SPECIALIST RISK AGENTS          │
              │  (Parallel Execution via LangGraph)      │
              ├─────────────────────────────────────────┤
              │ Financial Risk Agent (XGBoost)           │
              │ Customer Risk Agent (LightGBM)           │
              │ Fraud Detection Agent (IsolationForest)  │
              │ Operational Risk Agent                    │
              │ Cyber Risk Agent (UNSW-NB15)              │
              └───────────────────┬─────────────────────┘
                                  ↓
                       ⭐ Risk Correlation Agent
                                  ↓
                       Risk Scoring Engine
                                  ↓
                 ┌────────────────┴────────────────┐
                 ↓                                 ↓
        Risk Prediction Agent              Root Cause Agent
                 ↓                                 ↓
                 └────────────────┬────────────────┘
                                  ↓
                     ⭐ Impact Simulator
                                  ↓
                         Mitigation Agent
                                  ↓
                       Policy / Guardrail
                                  ↓
                    Human Approval Layer
                                  ↓
                             ACTION
```

## ⭐ Key USP Features

### 1. Cross-Risk Correlation Engine
Most platforms treat risk categories separately. RiskSentinel **connects them**:

```
Customer complaints ↑  →  Payment failures ↑  →  Product usage ↓
        →  Support tickets ↑  →  Churn Risk ↑  →  Revenue Risk ↑
```

### 2. Risk Velocity & Momentum
Two companies can have the same risk score of 80, but one jumped from 40→80 in 4 weeks while the other has been stable at 80. **Risk velocity tells you which is more dangerous.**

### 3. Counterfactual Risk Simulator
Ask: *"What happens if supplier S104 is delayed by another 5 days?"*
Get: Cascading impact projections through the entire risk graph.

### 4. Evidence-Based Risk Copilot
Not generic LLM answers — structured evidence from actual risk data:
```
Financial risk is HIGH at 76/100.
Main drivers: Receivables +21%, Payment failures +13%
Estimated exposure: ₹14.2L
Recommended action: Prioritize collection from top 10 high-risk accounts
```

### 5. Human-in-the-Loop AI Governance
AI recommends, humans decide. CRITICAL actions require approval. Policy guardrails prevent autonomous execution of high-impact decisions.

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| Backend | FastAPI (Python 3.11+) |
| Agent Orchestration | LangGraph |
| ML Models | XGBoost, LightGBM, Isolation Forest |
| Time Series | StatsForecast (AutoARIMA, AutoETS) |
| Vector Store (RAG) | ChromaDB |
| Database | SQLite (dev) / PostgreSQL (prod) |
| LLM | Google Gemini API |
| Frontend | React + Vite + TypeScript |
| Charts | Recharts |

## 📊 Datasets

| Dataset | Domain | Records | Source |
|:---|:---|:---|:---|
| UCI Credit Card Default | Financial/Credit Risk | 30,000 | UCI ML Repository |
| UNSW-NB15 | Cyber Risk | 175K+ | UNSW Cyber Range Lab |
| Telco Customer Churn | Customer Risk | 7,043 | IBM Sample Data |
| Credit Card Fraud | Fraud Detection | 284,807 | ULB Machine Learning Group |
| Operations (Synthetic) | Operational Risk | 10,000+ | Generated with causal relationships |

## 🚀 Quick Start

### 1. Setup Environment
```bash
cd "d:\Razorpay project"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
copy .env.example .env
# Edit .env with your GEMINI_API_KEY and KAGGLE credentials
```

### 3. Download & Process Data
```bash
cd "d:\Razorpay project"
python scripts/download_datasets.py
python scripts/generate_synthetic_data.py
python scripts/process_datasets.py
python scripts/create_scenarios.py
```

### 4. Train ML Models
```bash
python scripts/train_models.py
```

### 5. Seed Knowledge Base (RAG)
```bash
cd "d:\Razorpay project\backend"
python scripts/seed_knowledge_base.py
```

### 6. Start Backend
```bash
cd "d:\Razorpay project\backend"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### 7. Start Frontend
```bash
cd "d:\Razorpay project\frontend"
npm install
npm run dev
```

### 8. API Testing & Swagger Docs
```bash
# Keep backend running in terminal, open new terminal for tests

# Health check - verify models loaded & RAG seeded
curl http://127.0.0.1:8000/health
# Expected: {"status":"ok","models":{"credit":"loaded","churn":"loaded","fraud":"loaded","cyber":"loaded","operational":"loaded","forecaster":"loaded"},"rag_documents":6}

# Full risk assessment for customer C-0001
curl -X POST "http://127.0.0.1:8000/api/v1/assess/?entity_id=C-0001&entity_type=customer"

# Risk Copilot - RAG-powered chat with streaming SSE
curl -X POST "http://127.0.0.1:8000/api/v1/copilot/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the risk appetite for cyber risk?", "entity_id": "C-0001"}'

# Dashboard overview - risk distribution & domain scores
curl http://127.0.0.1:8000/api/v1/dashboard/overview

# Counterfactual simulator
curl -X POST "http://127.0.0.1:8000/api/v1/simulate/" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "C-0001", "scenario": "credit_limit_reduction", "parameters": {"credit_limit": 5000}}'

# Approval workflow
curl http://127.0.0.1:8000/api/v1/approvals/

# Swagger UI - Interactive API documentation
# Open in browser: http://127.0.0.1:8000/docs

# ReDoc - Alternative API documentation
# Open in browser: http://127.0.0.1:8000/redoc
```

### 9. Open Dashboard
Navigate to `http://localhost:5173`

## ✅ Verification Guide

Compare your API responses against these expected structures to confirm setup is working.

### 1. Health Check (`GET /health`)
```json
{
  "status": "ok",
  "models": {
    "credit": "loaded",
    "churn": "loaded",
    "fraud": "loaded",
    "cyber": "loaded",
    "operational": "loaded",
    "forecaster": "loaded"
  },
  "rag_documents": 6
}
```

### 2. Risk Assessment (`POST /api/v1/assess/?entity_id=C-0001&entity_type=customer`)
```json
{
  "assessment_id": "uuid",
  "entity_id": "C-0001",
  "entity_type": "customer",
  "composite_score": 54.63,
  "risk_level": "HIGH",
  "approval_status": "PENDING_APPROVAL",
  "financial_risk": {
    "score": 99.9,
    "default_probability": 0.999,
    "risk_tier": "CRITICAL",
    "drivers": ["credit_limit", "utilization_ratio", "payment_amount", "balance", "payment_ratio"],
    "exposure": 4334.2
  },
  "customer_risk": {
    "churn_probability": 0.7702,
    "score": 77.02,
    "signals": ["month_to_month_contract", "high_credit_utilization", "high_churn_risk"],
    "revenue_exposure": 370.86,
    "top_drivers": ["contract_type_enc", "charge_ratio", "credit_utilization", "tenure_months", "age"]
  },
  "fraud_risk": {
    "fraud_probability": 0.0124,
    "anomaly_score": 0.4451,
    "fraud_score": 0.1855,
    "is_fraud": false,
    "factors": ["normal_pattern"],
    "top_drivers": ["velocity_1h", "amount", "is_online", "distance_from_home", "hour_of_day"]
  },
  "operational_risk": {
    "score": 35.77,
    "supplier_reliability": 0.8,
    "predicted_delay_days": 2.1,
    "sla_breach_prob": 0.5848,
    "supplier_alerts": ["SLA breach risk: 58%"],
    "stockout_predictions": []
  },
  "cyber_risk": {
    "score": 16.91,
    "attack_probability": 0.1691,
    "attack_types": ["Normal"],
    "severity": "LOW",
    "indicators": ["rapid_connection"]
  },
  "correlations": {
    "matrix": {
      "financial": {"financial": 1.0, "customer": 1, "fraud": 0.71, "operational": 0.81, "cyber": 0.7},
      "customer": {"financial": 1, "customer": 1.0, "fraud": 0.57, "operational": 0.68, "cyber": 0.56},
      "fraud": {"financial": 0.71, "customer": 0.57, "fraud": 1.0, "operational": 0.33, "cyber": 0.21},
      "operational": {"financial": 0.81, "customer": 0.68, "fraud": 0.33, "operational": 1.0, "cyber": 0.32},
      "cyber": {"financial": 0.7, "customer": 0.56, "fraud": 0.21, "operational": 0.32, "cyber": 1.0}
    },
    "score": 52.0,
    "cascades": ["Churn Risk", "Operational Cascade", "Financial Stress"],
    "domain_scores": {"financial": 99.9, "customer": 77.02, "fraud": 18.55, "operational": 35.77, "cyber": 16.91},
    "exposure": 25705.06,
    "active_patterns": 3
  },
  "predictions": {
    "7_day": {"score": 54.24, "ci": [49.28, 59.21]},
    "30_day": {"score": 54.24, "ci": [49.28, 59.21]},
    "90_day": {"score": 54.24, "ci": [49.28, 59.21]}
  },
  "root_causes": [...],
  "simulation_results": {...},
  "mitigations": [...],
  "policy_decision": {"approved": false, "approval_required": true, "risk_level": "HIGH"},
  "audit_trail": [...]
}
```

### 3. Dashboard Overview (`GET /api/v1/dashboard/overview`)
```json
{
  "total_entities_monitored": 5000,
  "high_risk_entities": 1591,
  "critical_alerts": 759,
  "total_exposure": 1930961.0,
  "score": 54.3,
  "velocity": -5.28,
  "momentum": -6.34,
  "confidence": 93,
  "risk_distribution": {
    "LOW": 1130,
    "HIGH": 1119,
    "MODERATE": 1098,
    "VERY_HIGH": 853,
    "CRITICAL": 799
  },
  "domains": {
    "financial": 55.2,
    "customer": 53.9,
    "fraud": 53.8,
    "operational": 54.5,
    "cyber": 53.9
  }
}
```

### 4. Simulator (`POST /api/v1/simulate/`)
```json
{
  "original_exposure": 100000.0,
  "simulated_exposure": 0.0,
  "impact_diff": -100000.0,
  "cascade": {
    "root_cause": "credit_limit_reduction",
    "total_exposure": 0.0,
    "nodes": []
  }
}
```

### 5. Approvals (`GET /api/v1/approvals/`)
```json
[
  {
    "id": "app_1",
    "assessment_id": "assess_1",
    "action_type": "BLOCK_ACCOUNT",
    "status": "PENDING"
  }
]
```

### 6. Copilot Chat (`POST /api/v1/copilot/chat`)
Returns SSE stream - first event is metadata:
```
data: {"type": "meta", "sources": [{"filename": "cyber_incident_policy.md", "policy_id": "CIR-2023-01", "risk_type": "CYBER"}, ...]}
data: 🛡️ **RiskSentinel Analysis** ...
data: [DONE]
```

### Quick Verification Checklist
| Endpoint | Expected Key Fields | Status |
|----------|---------------------|--------|
| `GET /health` | `models.credit: "loaded"`, `rag_documents: 6` | ✅ |
| `POST /assess/` | `composite_score`, `risk_level`, `financial_risk`, `correlations` | ✅ |
| `GET /dashboard/overview` | `total_entities_monitored`, `risk_distribution`, `domains` | ✅ |
| `POST /simulate/` | `original_exposure`, `simulated_exposure`, `cascade` | ✅ |
| `GET /approvals/` | Array with `id`, `action_type`, `status` | ✅ |
| `GET /docs` | HTML page (Swagger UI) | ✅ |
| `GET /redoc` | HTML page (ReDoc) | ✅ |

### Common Issues & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `models: "not_found"` | MODEL_DIR path wrong | Check `.env` has `MODEL_DIR=../models` |
| `rag_documents: 0` | Knowledge base not seeded | Run `cd backend && python scripts/seed_knowledge_base.py` |
| Port 8000 refused | Server not running | Start with `uvicorn app.main:app --host 127.0.0.1 --port 8000` |
| SSE connection fails | Firewall/Proxy | Use `127.0.0.1` not `localhost` |

### PowerShell Equivalents (Windows)
```powershell
# Health check
Invoke-RestMethod http://127.0.0.1:8000/health

# Risk assessment
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/assess/?entity_id=C-0001&entity_type=customer"

# Copilot
$body = @{message="What is the risk appetite for cyber risk?"; entity_id="C-0001"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/copilot/chat" -Body $body -ContentType "application/json"

# Dashboard overview
Invoke-RestMethod http://127.0.0.1:8000/api/v1/dashboard/overview

# Simulator
$simBody = @{entity_id="C-0001"; scenario="credit_limit_reduction"; parameters=@{credit_limit=5000}} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/simulate/" -Body $simBody -ContentType "application/json"

# Approvals
Invoke-RestMethod http://127.0.0.1:8000/api/v1/approvals/
```

### Automated Verification Script
```bash
# Run all health checks at once
cd "d:\Razorpay project"
python scripts/verify_system.py
# Exit codes: 0=all pass, 1=health failed, 2=API failed, 3=server unreachable
```

## 📁 Project Structure

```
RiskSentinel/
├── backend/           # FastAPI + LangGraph + ML
│   ├── app/
│   │   ├── agents/    # LangGraph multi-agent system
│   │   ├── api/       # REST API endpoints
│   │   ├── db/        # Database layer
│   │   ├── ml/        # ML models & training
│   │   ├── rag/       # RAG & knowledge base
│   │   ├── risk_engine/ # Core risk scoring logic
│   │   └── schemas/   # Pydantic models
│   └── tests/
├── frontend/          # React + Vite dashboard
├── data/              # Datasets (raw + processed)
├── knowledge_base/    # Policy documents for RAG
├── models/            # Trained ML model weights
├── scripts/           # Data processing & training scripts
│   ├── verify_system.py   # Automated verification
│   ├── train_models.py    # Model training pipeline
│   ├── seed_knowledge_base.py
│   ├── generate_synthetic_data.py
│   ├── process_datasets.py
│   ├── download_datasets.py
│   └── create_scenarios.py
└── start_backend.bat    # Windows startup script
```

## 🔬 Risk Scoring Formula

```
Risk Score = 0.30 × ML Probability
           + 0.20 × Anomaly Score
           + 0.15 × Trend Score
           + 0.15 × Exposure
           + 0.10 × Business Criticality
           + 0.10 × Correlation Score
```

| Score Range | Level |
|:---|:---|
| 0–29 | 🟢 LOW |
| 30–49 | 🟡 MODERATE |
| 50–69 | 🟠 HIGH |
| 70–84 | 🔴 VERY HIGH |
| 85–100 | ⛔ CRITICAL |

## 🔧 Troubleshooting

### Models Not Loading (0/7)
```bash
# Ensure MODEL_DIR in .env points to project root models folder
MODEL_DIR=../models
# And main.py uses relative path from backend/
# registry.load_all_models("../models")
```

### Pydantic Validation Error (Extra fields)
```bash
# Add kaggle fields to Settings class in backend/app/config.py
kaggle_username: str = Field(default="", alias="KAGGLE_USERNAME")
kaggle_key: str = Field(default="", alias="KAGGLE_KEY")
# And set extra="ignore" in model_config
model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
```

### ChromaDB Path Mismatch
```bash
# .env should point to backend/chroma_db
CHROMA_PERSIST_DIR=./backend/chroma_db
```

### Unicode Encoding Errors (Windows)
```bash
# Replace emoji characters (✅, ❌) with ASCII in registry.py
print(f"  [OK] Loaded {name} from {path}")
print(f"  [FAIL] Failed to load {name}: {e}")
```

### Seed Script Import Error
```bash
# Run from backend directory with path setup
cd "d:\Razorpay project\backend"
python scripts/seed_knowledge_base.py
```

### NumPy Serialization in API
```bash
# Add serialization helper in risk_assessment.py
def _serialize(obj):
    if isinstance(obj, (np.integer, np.floating)): return obj.item()
    if isinstance(obj, np.ndarray): return obj.tolist()
    if isinstance(obj, dict): return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list): return [_serialize(v) for v in obj]
    return obj
# Remove MemorySaver checkpointer from risk_graph.py to avoid msgpack issues
```

### Port Conflicts
```bash
# If port 8000 is busy, use another port
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

## 📄 License

Academic/Research Use Only (UNSW-NB15 dataset restriction)
