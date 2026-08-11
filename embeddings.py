"""
Wraps the embedding model. We load it once at startup (it's ~90MB) and reuse
it for every request instead of reloading per-call.

Model: all-MiniLM-L6-v2
- Small and fast (runs fine on CPU, no GPU needed)
- Produces 384-dimensional vectors
- Good general-purpose quality for a portfolio-scale project
- Free, runs locally, no API key needed
"""

from sentence_transformers import SentenceTransformer

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of text chunks. Returns one vector per input text."""
    model = get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single search query."""
    return embed_texts([query])[0]
