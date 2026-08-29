# 🛡️ RiskSentinel — Agent Behavior & Project Context

> **Purpose**: This file is the canonical source of truth for any AI agent continuing work on the RiskSentinel project. It captures architecture decisions, coding conventions, project state, and behavioral guidelines.

---

## 🎯 Project Identity

**Name**: RiskSentinel — Enterprise Risk Intelligence Platform  
**Domain**: Financial Technology / Risk Management  
**Tagline**: Early-Warning. Cross-Risk Correlation. Decision Intelligence.

**What it does**: RiskSentinel continuously monitors financial, customer, operational, fraud, and cyber signals, detects emerging risks, correlates them across the enterprise, predicts their future impact, explains why they are occurring, and autonomously recommends mitigation actions with human approval.

**Target User**: Enterprise risk teams, compliance officers, and decision-makers at fintech/payment companies (inspired by Razorpay's domain).

---

## ⭐ USP Features (Non-Negotiable)

These are the project's differentiators. Every decision should serve these:

1. **Cross-Risk Correlation Engine** — Most platforms treat risk categories separately. RiskSentinel *connects them*:
   - `Customer complaints ↑ → Payment failures ↑ → Product usage ↓ → Churn Risk ↑ → Revenue Risk ↑`
   - Implemented in: `backend/app/risk_engine/correlation.py` + `backend/app/agents/nodes/risk_correlation.py`

2. **Risk Velocity & Momentum** — Two entities can have the same score, but different urgency:
   - `velocity = Δrisk_score / Δtime`
   - Momentum = acceleration/deceleration of velocity
   - Implemented in: `backend/app/risk_engine/velocity.py`

3. **Counterfactual Risk Simulator** — "What if supplier S104 is delayed 5 more days?"
   - Cascading impact propagation through the risk graph
   - Implemented in: `backend/app/agents/nodes/impact_simulator.py` + `backend/app/risk_engine/cascade.py`

4. **Evidence-Based Risk Copilot** — Not generic LLM answers. Structured evidence from actual data:
   - RAG-grounded using ChromaDB + enterprise policy documents
   - Implemented in: `backend/app/api/v1/endpoints/risk_copilot.py` + `backend/app/rag/`

5. **Human-in-the-Loop AI Governance** — AI recommends, humans decide:
   - CRITICAL risks require approval; LOW risks auto-approve
   - Implemented in: `backend/app/agents/nodes/policy_guardrail.py` + `backend/app/api/v1/endpoints/approval.py`

---

## 🏗️ Architecture Overview

### Multi-Agent Pipeline (LangGraph StateGraph)

```
START → data_quality → [PARALLEL: financial, customer, fraud, operational, cyber]
     → risk_correlation → risk_scoring → risk_prediction → root_cause
     → impact_simulator → mitigation → policy_guardrail
     → [CONDITIONAL: auto_approve → outcome_monitor → END | requires_approval → END]
```

Key architectural patterns:
- **Fan-out/Fan-in**: After `data_quality`, 5 specialist agents run in parallel, converging at `risk_correlation`
- **Conditional Routing**: `policy_guardrail` routes based on risk level (HIGH+ needs human approval)
- **State Accumulation**: `RiskAssessmentState` (TypedDict) accumulates results through the pipeline
- **Checkpointing**: `MemorySaver` enables resumable graph execution

### System Layers

```
┌─────────────────────────────────┐
│        Frontend (React/Vite)    │  Port 5173
├─────────────────────────────────┤
│        FastAPI Backend          │  Port 8000
├──────────┬──────────────────────┤
│ LangGraph│  Risk Engine         │
│ Agents   │  (scoring, velocity, │
│ (14 nodes│   correlation,       │
│  )       │   cascade)           │
├──────────┼──────────────────────┤
│ ML Models│  RAG (ChromaDB)      │
│ (XGBoost,│  + Gemini Embeddings │
│  LightGBM│                      │
│  IsoForest│                     │
├──────────┴──────────────────────┤
│ SQLite DB | Data Layer          │
└─────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Rationale |
|:---|:---|:---|:---|
| Backend | FastAPI | 0.115+ | Async I/O, Pydantic v2, auto OpenAPI, SSE |
| Agent Orchestration | LangGraph | 0.2+ | StateGraph, fan-out/fan-in, conditional routing, checkpointing |
| ML: Credit/Fraud | XGBoost | 2.0+ | Best-in-class for tabular data |
| ML: Churn | LightGBM | 4.0+ | Fast, handles categoricals natively |
| ML: Anomaly | Isolation Forest | scikit-learn | Unsupervised anomaly detection |
| Time Series | StatsForecast (Nixtla) | 1.7+ | 500x faster than Prophet, no C++ issues on Windows |
| Vector Store | ChromaDB | 0.5+ | Zero-config, LangChain native |
| Database | SQLite + aiosqlite | - | Zero setup for dev, upgrade path to PostgreSQL |
| LLM | Google Gemini API | gemini-2.0-flash | 1M context, free tier, function calling |
| Embeddings | text-embedding-004 | Gemini | Free tier, excellent quality |
| Frontend | React + Vite + TypeScript | React 18+ | Fast HMR, modern tooling |
| Charts | Recharts | - | Rich risk visualizations |
| Styling | Vanilla CSS | Dark theme | Full control, premium glassmorphism |

---

## 📊 Datasets

| Dataset | Domain | Records | Source | License |
|:---|:---|:---|:---|:---|
| UCI Credit Card Default | Financial/Credit | 30,000 | UCI ML Repository | CC BY 4.0 |
| UNSW-NB15 | Cyber Risk | 175K+ | UNSW Cyber Range Lab | Academic only |
| Telco Customer Churn | Customer Risk | 7,043 | IBM Sample Data | Public domain |
| Credit Card Fraud | Fraud Detection | 284,807 | ULB ML Group | Open Database License |
| Operations (Synthetic) | Operational Risk | 10,000+ | Generated internally | N/A |

All datasets are unified through a shared `entity_id` schema via `scripts/process_datasets.py`.

---

## 📁 Project Structure

```
d:/Razorpay project/
├── agent.md                          # THIS FILE — Agent behavior source
├── README.md                         # Project documentation
├── .env.example                      # Environment template
├── .gitignore
├── requirements.txt                  # Python dependencies
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI entrypoint + lifespan
│   │   ├── config.py                 # Pydantic BaseSettings
│   │   ├── agents/                   # LangGraph Multi-Agent System
│   │   │   ├── state.py              # RiskAssessmentState TypedDict
│   │   │   ├── risk_graph.py         # StateGraph builder (14 nodes)
│   │   │   └── nodes/               # 14 agent node implementations
│   │   │       ├── data_quality.py
│   │   │       ├── financial_risk.py
│   │   │       ├── customer_risk.py
│   │   │       ├── fraud_risk.py
│   │   │       ├── operational_risk.py
│   │   │       ├── cyber_risk.py
│   │   │       ├── risk_correlation.py   ⭐
│   │   │       ├── risk_scoring.py
│   │   │       ├── risk_prediction.py
│   │   │       ├── root_cause.py
│   │   │       ├── impact_simulator.py   ⭐
│   │   │       ├── mitigation.py
│   │   │       ├── policy_guardrail.py
│   │   │       └── outcome_monitor.py
│   │   ├── api/v1/
│   │   │   ├── router.py
│   │   │   └── endpoints/
│   │   │       ├── risk_assessment.py
│   │   │       ├── risk_dashboard.py
│   │   │       ├── risk_copilot.py
│   │   │       ├── simulator.py
│   │   │       └── approval.py
│   │   ├── ml/
│   │   │   ├── registry.py
│   │   │   ├── feature_engineering.py
│   │   │   └── models/              # Individual ML model implementations
│   │   ├── rag/
│   │   │   ├── vector_store.py
│   │   │   ├── embeddings.py
│   │   │   └── document_loader.py
│   │   ├── risk_engine/
│   │   │   ├── scoring.py           # Weighted risk score formula
│   │   │   ├── velocity.py          # Risk velocity & momentum
│   │   │   ├── correlation.py       # Cross-risk correlation
│   │   │   └── cascade.py           # Risk cascade builder
│   │   ├── db/
│   │   │   ├── database.py          # SQLite async engine
│   │   │   ├── models.py            # SQLAlchemy ORM
│   │   │   └── repositories.py      # CRUD operations
│   │   └── schemas/
│   │       ├── risk_schemas.py      # Pydantic models for risk domain
│   │       └── agent_schemas.py     # Pydantic models for agent results
│   └── scripts/
│
├── data/
│   ├── raw/                         # Downloaded datasets
│   ├── processed/                   # Cleaned & unified
│   ├── synthetic/                   # Generated data
│   └── scenarios/                   # Demo scenario JSONs
│
├── knowledge_base/                  # Policy docs for RAG
├── models/                          # Trained ML model weights
├── scripts/                         # Data, training, seeding scripts
│   ├── download_datasets.py
│   ├── generate_synthetic_data.py
│   ├── process_datasets.py
│   └── create_scenarios.py
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                   # Hash-based routing
        ├── index.css                 # Dark theme design system
        ├── components/
        │   ├── layout/              # Sidebar, Header, Layout
        │   ├── dashboard/           # RiskOverview, AlertFeed, RiskVelocity, RiskCascade
        │   ├── copilot/             # CopilotChat
        │   ├── simulator/           # CounterfactualPanel
        │   ├── approval/            # ApprovalQueue
        │   └── common/              # Reusable UI components
        ├── lib/                     # API client, utilities
        └── types/                   # TypeScript types
```

---

## 🎨 Design System

### Color Palette
```css
--bg-deepest: #0a0e1a;       /* Page background */
--bg-cards: #111827;           /* Card backgrounds */
--bg-elevated: #1a1f36;       /* Elevated elements */
--accent-primary: #3b82f6;    /* Blue accent */
--risk-low: #10b981;          /* Emerald green */
--risk-moderate: #f59e0b;     /* Amber */
--risk-high: #f97316;         /* Orange */
--risk-very-high: #ef4444;    /* Red */
--risk-critical: #dc2626;     /* Dark red */
```

### Design Principles
- **Dark theme** with deep navy/charcoal backgrounds
- **Glassmorphism** cards: `backdrop-filter: blur(12px)`, semi-transparent backgrounds
- **Micro-animations**: fade-in, slide-up, pulse-critical for alerts
- **Typography**: Inter font family
- **Risk severity colors** are semantic and consistent across all components
- **Responsive grid** layout using CSS Grid utilities

---

## 🔢 Risk Scoring Formula

```
Risk Score = 0.30 × ML_Probability
           + 0.20 × Anomaly_Score
           + 0.15 × Trend_Score
           + 0.15 × Exposure
           + 0.10 × Business_Criticality
           + 0.10 × Correlation_Score
```

| Score Range | Level | Color |
|:---|:---|:---|
| 0–29 | 🟢 LOW | `--risk-low` |
| 30–49 | 🟡 MODERATE | `--risk-moderate` |
| 50–69 | 🟠 HIGH | `--risk-high` |
| 70–84 | 🔴 VERY HIGH | `--risk-very-high` |
| 85–100 | ⛔ CRITICAL | `--risk-critical` |

---

## 📋 Coding Conventions

### Python (Backend)
- **Python 3.11+** required
- **Type hints** on all function signatures
- **Pydantic v2** for all schemas (BaseModel, not dataclass)
- **async/await** for all I/O-bound operations
- **SQLAlchemy 2.0** style (declarative_base, async sessions)
- **Imports**: Use `from app.xxx import yyy` (app-relative imports)
- **Agent nodes**: Each node is a pure function `def xxx_node(state: RiskAssessmentState) -> dict`
- **Return convention**: Agent nodes return partial state dicts (only the fields they modify)
- **Audit trail**: Every agent node must append to `audit_trail` list

### TypeScript (Frontend)
- **React 18+** with functional components and hooks
- **TypeScript** strict mode
- **CSS**: Vanilla CSS with CSS custom properties (no Tailwind)
- **State**: `useState` + `useEffect` for simple state; no Redux
- **Routing**: Hash-based routing (`window.location.hash`)
- **API calls**: Fetch API with custom `lib/api.ts` wrapper
- **Naming**: PascalCase for components, camelCase for functions/variables

### General
- **No placeholder images**: Use generated images or SVG icons
- **Comments**: Preserve existing comments; add JSDoc for public functions
- **Error handling**: Graceful degradation, never crash the pipeline
- **Deterministic scoring**: Risk scores are computed deterministically, NOT by LLM

---

## 🔄 Current Project State

### What's Built (Skeleton/Stubs)
- ✅ Project skeleton: `requirements.txt`, `.gitignore`, `.env.example`, `README.md`
- ✅ Backend structure: FastAPI app, config, CORS, lifespan
- ✅ LangGraph graph: `risk_graph.py` with 14 nodes wired (fan-out/fan-in topology)
- ✅ Agent state: `RiskAssessmentState` TypedDict with all fields
- ✅ Agent node stubs: All 14 nodes exist but return **hardcoded/mock data**
- ✅ Risk engine core: `scoring.py`, `velocity.py`, `correlation.py`, `cascade.py` — **functional but basic**
- ✅ DB layer: SQLAlchemy models, async engine, repositories (basic CRUD)
- ✅ RAG stubs: `vector_store.py`, `embeddings.py`, `document_loader.py` — placeholder implementations
- ✅ API endpoints: All 5 endpoint files exist with basic implementations
- ✅ Frontend: Vite + React + TypeScript setup, dark theme CSS, component structure
- ✅ Scripts: `download_datasets.py`, `generate_synthetic_data.py`, `process_datasets.py`, `create_scenarios.py`

### What Needs Real Implementation
- ❌ **ML Models**: `models/` directory has no real model files (credit, churn, fraud, cyber, operational, forecaster)
- ❌ **Model Training**: No `train_models.py` or `seed_knowledge_base.py` scripts
- ❌ **Agent Nodes**: All 14 nodes return mock/hardcoded data — need real ML integration
- ❌ **RAG System**: ChromaDB + embeddings are stubs — need real Gemini integration
- ❌ **Knowledge Base**: Policy documents need to be created in `knowledge_base/`
- ❌ **Frontend Components**: Components exist but need rich implementations with real API integration
- ❌ **Missing Components**: RiskHeatMap, RiskRadar, RiskTimeline, AgentStatus, ActionCard, ImpactVisualization, CopilotMessage, MetricCard, SparkLine, AnimatedCounter, RiskBadge
- ❌ **Tests**: No test files created yet
- ❌ **End-to-end**: Pipeline doesn't run end-to-end with real data yet

---

## 🚀 Continuation Guide

### Priority Order for Implementation

1. **Phase 3: ML Models** — Create real model implementations in `backend/app/ml/models/`
   - `credit_risk_model.py` (XGBoost on UCI Credit Card)
   - `churn_model.py` (LightGBM on Telco Churn)
   - `fraud_model.py` (Isolation Forest + XGBoost on Credit Card Fraud)
   - `cyber_model.py` (Random Forest on UNSW-NB15)
   - `operational_model.py` (on synthetic data)
   - `forecaster.py` (StatsForecast for risk prediction)
   - `scripts/train_models.py` — master training pipeline

2. **Phase 4: Agent Nodes** — Replace stub implementations with real ML-backed logic
   - Each node should call real ML models via `registry.py`
   - Use SHAP for feature explanations where applicable

3. **Phase 5: RAG & Knowledge Base** — Create policy docs and wire up ChromaDB
   - 6 policy documents in `knowledge_base/`
   - `scripts/seed_knowledge_base.py`
   - Wire Gemini embeddings in `embeddings.py`

4. **Phase 6: API Enhancement** — SSE streaming for copilot, real data for dashboard

5. **Phase 7: Frontend Polish** — Missing components, real API integration, animations

6. **Phase 8: Integration & Testing** — End-to-end pipeline, unit tests, demo prep

### Environment Requirements
```bash
# Python virtual environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Environment variables needed
GEMINI_API_KEY=<Google AI Studio API key>
KAGGLE_USERNAME=<Kaggle username>
KAGGLE_KEY=<Kaggle API key>

# Frontend
cd frontend
npm install
```

### Startup Commands
```bash
# Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm run dev
# Opens at http://localhost:5173
```

---

## ⚠️ Important Constraints

1. **UNSW-NB15 is academic-only** — This project is for research/academic purposes
2. **Gemini free tier**: 15 RPM, 1M context — design for batch, not per-request LLM calls
3. **Windows development**: All paths use Windows conventions; scripts must be cross-platform where possible
4. **No Docker required**: SQLite for dev, direct venv setup
5. **Deterministic scoring**: Risk scores are NEVER generated by LLM — always computed by the formula
6. **Agent audit trail**: Every LangGraph node MUST append to `audit_trail` for traceability

---

## 🧠 Agent Behavioral Rules

When continuing this project, the AI agent MUST:

1. **Read this file first** before making any changes
2. **Follow the implementation plan** from the previous conversation (Phase 1-8)
3. **Maintain the existing architecture** — don't restructure unless explicitly asked
4. **Keep agent nodes as pure functions** returning partial state dicts
5. **Use the established design system** (CSS variables, glassmorphism, dark theme)
6. **Never use Tailwind CSS** — we use vanilla CSS with utility classes defined in `index.css`
7. **Preserve all existing code and comments** unless fixing bugs
8. **Test after each phase** — verify the pipeline still compiles and runs
9. **Update task.md** as work progresses
10. **Create walkthrough.md** after completing significant work

---

*Last updated: 2026-08-22*
*Previous conversation: `38ca5e54-5c43-4281-a74f-7f26389bed85`*
