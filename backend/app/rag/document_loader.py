"""
Document Loader — Loads, chunks, and extracts metadata from policy documents.
"""
import os
import re
import hashlib
from typing import List, Dict


class Document:
    """Represents a document chunk with content and metadata."""
    def __init__(self, page_content: str, metadata: dict):
        self.page_content = page_content
        self.metadata = metadata


# Map filenames to risk types
RISK_TYPE_MAP = {
    "risk_policy": "ENTERPRISE",
    "financial_control_policy": "FINANCIAL",
    "fraud_policy": "FRAUD",
    "cyber_incident_policy": "CYBER",
    "customer_escalation_policy": "CUSTOMER",
    "supplier_risk_policy": "OPERATIONAL",
}


def load_policies(dir_path: str) -> List[Document]:
    """Load all markdown policy documents from the knowledge_base directory."""
    docs = []
    if not os.path.exists(dir_path):
        return docs

    for filename in sorted(os.listdir(dir_path)):
        if filename.endswith(".md"):
            filepath = os.path.join(dir_path, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            metadata = extract_metadata(content, filename)
            docs.append(Document(page_content=content, metadata=metadata))

    return docs


def extract_metadata(content: str, filename: str = "") -> Dict:
    """Extract structured metadata from policy markdown files."""
    meta = {
        "filename": filename,
        "policy_id": "UNKNOWN",
        "risk_type": "GENERAL",
        "department": "RISK",
        "severity": "MODERATE",
        "version": "1.0",
    }

    base_name = filename.replace(".md", "")
    meta["risk_type"] = RISK_TYPE_MAP.get(base_name, "GENERAL")

    for line in content.split("\n"):
        line = line.strip()
        if "Policy ID:" in line:
            match = re.search(r"Policy ID:\*?\*?\s*(.+?)(?:\s*\*?\*?$|\s*$)", line)
            if match:
                meta["policy_id"] = match.group(1).strip()
        elif "Version:" in line:
            match = re.search(r"Version:\*?\*?\s*(.+?)(?:\s*\*?\*?$|\s*$)", line)
            if match:
                meta["version"] = match.group(1).strip()
        elif "Owner:" in line:
            match = re.search(r"Owner:\*?\*?\s*(.+?)(?:\s*\*?\*?$|\s*$)", line)
            if match:
                meta["department"] = match.group(1).strip()
        elif "Effective Date:" in line:
            match = re.search(r"Effective Date:\*?\*?\s*(.+?)(?:\s*\*?\*?$|\s*$)", line)
            if match:
                meta["effective_date"] = match.group(1).strip()

    return meta


def chunk_document(doc: Document, chunk_size: int = 500, overlap: int = 100) -> List[Document]:
    """Split a document into overlapping word-level chunks."""
    words = doc.page_content.split()
    chunks = []
    start = 0
    chunk_index = 0

    while start < len(words):
        end = start + chunk_size
        chunk_text = " ".join(words[start:end])
        chunk_meta = {
            **doc.metadata,
            "chunk_index": chunk_index,
            "chunk_start_word": start,
            "chunk_end_word": min(end, len(words)),
            "chunk_id": hashlib.md5(f"{doc.metadata.get('filename', '')}_{chunk_index}".encode()).hexdigest(),
        }
        chunks.append(Document(page_content=chunk_text, metadata=chunk_meta))
        start += chunk_size - overlap
        chunk_index += 1

    return chunks


def load_and_chunk_all(dir_path: str, chunk_size: int = 500, overlap: int = 100) -> List[Document]:
    """Load all policies and chunk them. Convenience wrapper."""
    docs = load_policies(dir_path)
    all_chunks = []
    for doc in docs:
        chunks = chunk_document(doc, chunk_size=chunk_size, overlap=overlap)
        all_chunks.extend(chunks)
    return all_chunks
