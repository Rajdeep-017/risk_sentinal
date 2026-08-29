"""
Embeddings module — Gemini text-embedding-004 with TF-IDF fallback.
"""
from typing import List, Optional
from app.config import settings

_embeddings_model = None
_fallback_vectorizer = None


def _get_embeddings_model():
    """Lazy-load Gemini embeddings model."""
    global _embeddings_model
    if _embeddings_model is not None:
        return _embeddings_model
    try:
        if settings.gemini_api_key and settings.gemini_api_key != "dummy_key":
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            _embeddings_model = GoogleGenerativeAIEmbeddings(
                model="text-embedding-004",
                google_api_key=settings.gemini_api_key,
            )
            return _embeddings_model
    except Exception as e:
        print(f"Gemini embeddings init failed: {e}")
    return None


def embed_text(text: str) -> Optional[List[float]]:
    """Embed a single text string."""
    model = _get_embeddings_model()
    if model is not None:
        try:
            return model.embed_query(text)
        except Exception as e:
            print(f"Gemini embed error: {e}")

    # Fallback to TF-IDF
    return _tfidf_embed([text])[0]


def embed_batch(texts: List[str]) -> List[List[float]]:
    """Embed a batch of texts."""
    model = _get_embeddings_model()
    if model is not None:
        try:
            return model.embed_documents(texts)
        except Exception as e:
            print(f"Gemini batch embed error: {e}")

    # Fallback to TF-IDF
    return _tfidf_embed(texts)


def _tfidf_embed(texts: List[str]) -> List[List[float]]:
    """Simple TF-IDF based embedding fallback."""
    global _fallback_vectorizer
    from sklearn.feature_extraction.text import TfidfVectorizer

    if _fallback_vectorizer is None:
        _fallback_vectorizer = TfidfVectorizer(max_features=384)
        _fallback_vectorizer.fit(texts)

    try:
        matrix = _fallback_vectorizer.transform(texts)
    except Exception:
        # Refit if vocabulary changed
        _fallback_vectorizer = TfidfVectorizer(max_features=384)
        matrix = _fallback_vectorizer.fit_transform(texts)

    return matrix.toarray().tolist()
