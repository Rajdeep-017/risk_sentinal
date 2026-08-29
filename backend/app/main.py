"""FastAPI Main — Application entrypoint with full model and RAG initialization."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.database import init_db
from app.api.v1.router import api_router
from app.ml.registry import registry
from app.rag.vector_store import vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database, ML models, and RAG on startup."""
    await init_db()

    # Load all trained ML models
    registry.load_all_models("../models")

    # Initialize RAG vector store
    try:
        vector_store.init_collection("risk_policies")
        count = vector_store.get_count()
        if count > 0:
            print(f"RAG: {count} documents loaded from ChromaDB")
        else:
            print("RAG: No documents in ChromaDB. Run 'python scripts/seed_knowledge_base.py'")
    except Exception as e:
        print(f"RAG init warning: {e}")

    yield


app = FastAPI(title="RiskSentinel API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "models": registry.status(),
        "rag_documents": vector_store.get_count(),
    }
