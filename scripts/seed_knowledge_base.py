"""
Seed Knowledge Base — Loads policy documents into ChromaDB with embeddings.
Run: python scripts/seed_knowledge_base.py
"""
import sys
import os
import hashlib
from pathlib import Path

BASE_DIR = Path("d:/Razorpay project")
sys.path.insert(0, str(BASE_DIR / "backend"))

from rich.console import Console
console = Console()

KB_DIR = BASE_DIR / "knowledge_base"
CHROMA_DIR = BASE_DIR / "chroma_db"


def extract_metadata_from_policy(content: str, filename: str) -> dict:
    """Extract structured metadata from policy markdown files."""
    meta = {
        "filename": filename,
        "policy_id": "UNKNOWN",
        "risk_type": "GENERAL",
        "department": "RISK",
        "severity": "MODERATE",
    }

    # Map filenames to risk types
    risk_type_map = {
        "risk_policy": "ENTERPRISE",
        "financial_control_policy": "FINANCIAL",
        "fraud_policy": "FRAUD",
        "cyber_incident_policy": "CYBER",
        "customer_escalation_policy": "CUSTOMER",
        "supplier_risk_policy": "OPERATIONAL",
    }

    base_name = filename.replace(".md", "")
    meta["risk_type"] = risk_type_map.get(base_name, "GENERAL")

    # Extract policy ID from content
    for line in content.split("\n"):
        if "Policy ID:" in line:
            meta["policy_id"] = line.split("Policy ID:")[-1].strip().strip("*")
        elif "Owner:" in line:
            meta["department"] = line.split("Owner:")[-1].strip().strip("*")

    return meta


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list:
    """Split text into overlapping word-level chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def generate_embeddings_fallback(texts: list) -> list:
    """Generate simple TF-IDF based embeddings as fallback when no API key is available."""
    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer(max_features=384)
    tfidf_matrix = vectorizer.fit_transform(texts)
    return tfidf_matrix.toarray().tolist()


def main():
    console.print("[bold green]🛡️  RiskSentinel — Knowledge Base Seeding[/bold green]")

    if not KB_DIR.exists():
        console.print(f"[red]Knowledge base directory not found: {KB_DIR}[/red]")
        return

    # Load all policy documents
    policy_files = list(KB_DIR.glob("*.md"))
    if not policy_files:
        console.print("[red]No policy documents found in knowledge_base/[/red]")
        return

    console.print(f"Found {len(policy_files)} policy documents")

    all_chunks = []
    all_metadata = []
    all_ids = []

    for pf in policy_files:
        content = pf.read_text(encoding="utf-8")
        meta = extract_metadata_from_policy(content, pf.name)

        chunks = chunk_text(content, chunk_size=500, overlap=100)
        console.print(f"  📄 {pf.name}: {len(chunks)} chunks (risk_type={meta['risk_type']})")

        for i, chunk in enumerate(chunks):
            chunk_id = hashlib.md5(f"{pf.name}_{i}_{chunk[:50]}".encode()).hexdigest()
            chunk_meta = {**meta, "chunk_index": i, "total_chunks": len(chunks)}
            all_chunks.append(chunk)
            all_metadata.append(chunk_meta)
            all_ids.append(chunk_id)

    console.print(f"\nTotal chunks to embed: {len(all_chunks)}")

    # Try Gemini embeddings first, fall back to TF-IDF
    embeddings = None
    try:
        from app.config import settings
        if settings.gemini_api_key and settings.gemini_api_key != "dummy_key":
            console.print("[cyan]Using Gemini text-embedding-004...[/cyan]")
            from app.rag.embeddings import embed_batch
            embeddings = embed_batch(all_chunks)
            console.print(f"  Generated {len(embeddings)} Gemini embeddings")
        else:
            raise ValueError("No API key")
    except Exception as e:
        console.print(f"[yellow]Gemini embeddings unavailable ({e}), using TF-IDF fallback[/yellow]")
        embeddings = generate_embeddings_fallback(all_chunks)
        console.print(f"  Generated {len(embeddings)} TF-IDF embeddings (dim={len(embeddings[0])})")

    # Store in ChromaDB
    import chromadb

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    # Delete existing collection if any
    try:
        client.delete_collection("risk_policies")
    except Exception:
        pass

    collection = client.create_collection(
        name="risk_policies",
        metadata={"hnsw:space": "cosine"},
    )

    # Add in batches
    batch_size = 50
    for i in range(0, len(all_chunks), batch_size):
        batch_end = min(i + batch_size, len(all_chunks))
        collection.add(
            documents=all_chunks[i:batch_end],
            metadatas=all_metadata[i:batch_end],
            ids=all_ids[i:batch_end],
            embeddings=embeddings[i:batch_end] if embeddings else None,
        )

    console.print(f"\n[bold green]✅ Seeded ChromaDB with {collection.count()} document chunks[/bold green]")
    console.print(f"  Persisted at: {CHROMA_DIR}")

    # Verify with a test query
    console.print("\n[bold]Test query: 'What is the risk appetite for cyber risk?'[/bold]")
    results = collection.query(
        query_texts=["What is the risk appetite for cyber risk?"],
        n_results=3,
    )
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        console.print(f"  [{i+1}] {meta['filename']} (chunk {meta['chunk_index']}): {doc[:100]}...")


if __name__ == "__main__":
    main()
