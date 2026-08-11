"""
Builds the prompt sent to the LLM. This is the core of "grounding" the
answer in the user's documents instead of the model's general knowledge.

Key design choices:
- We number each retrieved chunk as a labeled source ([Source 1], [Source 2]...)
  and instruct the model to cite which source(s) it used inline.
- We explicitly tell the model to say when the answer isn't in the documents,
  instead of falling back to its own general knowledge. This is what
  prevents hallucination in a RAG app.
"""

SYSTEM_PROMPT_TEMPLATE = """You are a document assistant. Answer the user's question using ONLY the information in the sources below.

Rules:
- Base your answer strictly on the provided sources. Do not use outside knowledge.
- After each claim, cite the source number it came from, like [Source 1].
- If the sources don't contain enough information to answer, say so clearly instead of guessing.
- Be concise and direct.
- Formatting: if your answer has multiple points, steps, or items, put EACH one on its own line
  starting with "- ". Do not cram lists into a single paragraph. Use a blank line between
  distinct sections of your answer (e.g. between an intro sentence and a list).

Sources:
{sources_block}
"""


def build_sources_block(matches: list[dict]) -> str:
    """
    matches: [{"text": ..., "filename": ..., "page": ..., "relevance_score": ...}, ...]
    """
    blocks = []
    for i, match in enumerate(matches, start=1):
        blocks.append(
            f"[Source {i}] (from {match['filename']}, page {match['page']})\n{match['text']}"
        )
    return "\n\n".join(blocks)


def build_system_prompt(matches: list[dict]) -> str:
    sources_block = build_sources_block(matches) if matches else "No relevant sources found."
    return SYSTEM_PROMPT_TEMPLATE.format(sources_block=sources_block)


def build_citation_map(matches: list[dict]) -> dict:
    """
    Maps "Source 1" -> {"filename": ..., "page": ...} so the frontend can
    resolve [Source 1] references in the answer text to real file/page info.
    """
    return {
        f"Source {i}": {"filename": m["filename"], "page": m["page"]}
        for i, m in enumerate(matches, start=1)
    }
