"""
Lightweight vector store using plain numpy — no native/C++ compilation
required, unlike chroma-hnswlib. For a project at this scale (a handful of
documents per session, not millions of vectors), a linear cosine-similarity
scan is more than fast enough, and it sidesteps a genuinely painful
Windows build-tools dependency that ChromaDB pulls in.

Each session's chunks + embeddings are persisted to a small JSON file on
disk, so sessions survive a server restart.
"""

import json
import os
import numpy as np

from app.embeddings import embed_texts, embed_query

STORE_DIR = "./vector_store_data"
os.makedirs(STORE_DIR, exist_ok=True)


def _session_path(session_id: str) -> str:
    safe_id = session_id.replace("/", "_").replace("\\", "_")
    return os.path.join(STORE_DIR, f"{safe_id}.json")


def _load_session(session_id: str) -> list[dict]:
    path = _session_path(session_id)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_session(session_id: str, records: list[dict]) -> None:
    path = _session_path(session_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f)


def add_chunks(session_id: str, chunks: list[dict]) -> None:
    """
    chunks: [{"filename": ..., "page": ..., "chunk_index": ..., "text": ...}, ...]
    """
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    records = _load_session(session_id)
    for chunk, embedding in zip(chunks, embeddings):
        records.append({
            "filename": chunk["filename"],
            "page": chunk["page"],
            "chunk_index": chunk["chunk_index"],
            "text": chunk["text"],
            "embedding": embedding,
        })

    _save_session(session_id, records)


def query_chunks(session_id: str, query: str, top_k: int = 4) -> list[dict]:
    """
    Returns the top_k most relevant chunks for the query, each with its
    source metadata, sorted by relevance (most relevant first).
    """
    records = _load_session(session_id)
    if not records:
        return []

    query_vec = np.array(embed_query(query))
    doc_matrix = np.array([r["embedding"] for r in records])

    # Cosine similarity: dot product of normalized vectors
    query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-10)
    doc_norms = doc_matrix / (np.linalg.norm(doc_matrix, axis=1, keepdims=True) + 1e-10)
    similarities = doc_norms @ query_norm

    top_k = min(top_k, len(records))
    top_indices = np.argsort(similarities)[::-1][:top_k]

    matches = []
    for i in top_indices:
        record = records[i]
        matches.append({
            "text": record["text"],
            "filename": record["filename"],
            "page": record["page"],
            "relevance_score": round(float(similarities[i]), 4),
        })

    return matches


def session_exists(session_id: str) -> bool:
    return len(_load_session(session_id)) > 0
