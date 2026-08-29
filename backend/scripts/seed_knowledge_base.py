import sys
from pathlib import Path

BASE_DIR = Path("d:/Razorpay project")
sys.path.insert(0, str(BASE_DIR / "backend"))

import os
from app.rag.vector_store import RiskVectorStore
from app.rag.embeddings import embed_batch
from app.rag.document_loader import load_policies, chunk_document

print("Seeding knowledge base...")
store = RiskVectorStore()
store.init_collection("risk_policies")
docs = load_policies(str(BASE_DIR / "knowledge_base"))
all_chunks = []
for d in docs:
    all_chunks.extend(chunk_document(d))

if all_chunks:
    texts = [c.page_content for c in all_chunks]
    metadatas = [c.metadata for c in all_chunks]
    embeddings = embed_batch(texts)
    store.add_documents(texts, metadatas, embeddings)
print("Done seeding.")
