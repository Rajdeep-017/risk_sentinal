"""
Vector Store — ChromaDB-backed vector store with embedding support.
"""
import hashlib
from typing import List, Dict, Optional
import chromadb
from app.config import settings


class RiskVectorStore:
    """ChromaDB-backed vector store for risk policy documents."""

    def __init__(self):
        self.client = None
        self.collection = None
        self._initialized = False

    def _ensure_client(self):
        if self.client is None:
            try:
                self.client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
            except Exception as e:
                print(f"ChromaDB init error: {e}")
                self.client = chromadb.Client()  # In-memory fallback

    def init_collection(self, name: str = "risk_policies"):
        """Initialize or get the collection."""
        self._ensure_client()
        self.collection = self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )
        self._initialized = True
        return self.collection

    def add_documents(self, docs: List[str], metadata: List[Dict],
                      embeddings: Optional[List[List[float]]] = None,
                      ids: Optional[List[str]] = None):
        """Add documents with metadata and optional pre-computed embeddings."""
        if not self.collection:
            self.init_collection()

        if ids is None:
            ids = [hashlib.md5(f"{i}_{d[:50]}".encode()).hexdigest() for i, d in enumerate(docs)]

        # Add in batches to avoid memory issues
        batch_size = 100
        for i in range(0, len(docs), batch_size):
            batch_end = min(i + batch_size, len(docs))
            kwargs = {
                "documents": docs[i:batch_end],
                "metadatas": metadata[i:batch_end],
                "ids": ids[i:batch_end],
            }
            if embeddings is not None:
                kwargs["embeddings"] = embeddings[i:batch_end]
            self.collection.add(**kwargs)

    def search(self, query: str, filters: Optional[Dict] = None, k: int = 5) -> Dict:
        """Search for relevant documents by query text."""
        if not self.collection:
            self.init_collection()

        try:
            count = self.collection.count()
            if count == 0:
                return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
        except Exception:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        kwargs = {
            "query_texts": [query],
            "n_results": min(k, self.collection.count()),
        }
        if filters:
            kwargs["where"] = filters

        try:
            results = self.collection.query(**kwargs)
            return results
        except Exception as e:
            print(f"ChromaDB search error: {e}")
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

    def search_by_risk_type(self, query: str, risk_type: str, k: int = 5) -> Dict:
        """Search filtered by risk type."""
        return self.search(query, filters={"risk_type": risk_type}, k=k)

    def get_count(self) -> int:
        """Get the number of documents in the collection."""
        if not self.collection:
            self.init_collection()
        try:
            return self.collection.count()
        except Exception:
            return 0

    def is_seeded(self) -> bool:
        """Check if the knowledge base has been seeded."""
        return self.get_count() > 0


# Global singleton
vector_store = RiskVectorStore()
