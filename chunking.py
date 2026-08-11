"""
Splits page-level text into smaller overlapping chunks.

Why chunk at all?
- Embedding models work best on smaller pieces of text (a few hundred words),
  not entire documents.
- Overlap between chunks prevents losing context at chunk boundaries
  (e.g. a sentence that gets cut in half).

Why overlap matters (concrete example):
  Chunk 1 ends: "...the algorithm avoids deadlock by"
  Chunk 2 starts: "requesting all resources at once."
  Without overlap, neither chunk alone contains the full idea.
  With overlap, chunk 2 would start a bit earlier and include the full sentence.
"""

CHUNK_SIZE = 800       # characters per chunk (rough proxy for ~150-200 words)
CHUNK_OVERLAP = 150    # characters shared between consecutive chunks


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())

        if end >= text_length:
            break

        start = end - overlap  # step forward, but re-include the overlap window

    return [c for c in chunks if c]


def chunk_document(filename: str, pages: list[dict]) -> list[dict]:
    """
    Takes extracted pages [{"page": 1, "text": "..."}, ...] and returns
    a flat list of chunk records ready for embedding:

    [{"filename": "notes.pdf", "page": 1, "chunk_index": 0, "text": "..."}, ...]
    """
    all_chunks = []
    chunk_counter = 0

    for page_data in pages:
        page_number = page_data["page"]
        page_text = page_data["text"]

        for piece in chunk_text(page_text):
            all_chunks.append({
                "filename": filename,
                "page": page_number,
                "chunk_index": chunk_counter,
                "text": piece,
            })
            chunk_counter += 1

    return all_chunks
